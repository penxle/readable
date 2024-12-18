import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { and, asc, cosineDistance, eq } from 'drizzle-orm';
import { uniqueBy } from 'remeda';
import { z } from 'zod';
import { builder } from '@/builder';
import { db, firstOrThrow, PageContentChunks, PageContents, Pages, Sites } from '@/db';
import { PageState } from '@/enums';
import * as langchain from '@/external/langchain';
import { fixByChangePrompt, keywordExtractionPrompt } from '@/prompt/fix-by-change';
import { assertSitePermission } from '@/utils/permissions';
import { assertTeamPlanRule } from '@/utils/plan';
import { Page } from './objects';

type FindOutdatedContent = {
  pageId: string;
  fixes: {
    nodeId: string;
    original: string;
    suggestion: string;
    relevance: number;
    reason: string;
  }[];
};

const FindOutdatedContent = builder.objectRef<FindOutdatedContent>('FindOutdatedContent');
FindOutdatedContent.implement({
  fields: (t) => ({
    page: t.field({ type: Page, resolve: (hit) => hit.pageId }),
    fixes: t.field({
      type: [
        builder.simpleObject('FindOutdatedContentFix', {
          fields: (t) => ({
            nodeId: t.string(),
            original: t.string(),
            suggestion: t.string(),
            relevance: t.float(),
            reason: t.string(),
          }),
        }),
      ],
      resolve: (hit) => hit.fixes,
    }),
  }),
});

builder.queryFields((t) => ({
  findOutdatedContent: t.withAuth({ session: true }).field({
    type: [FindOutdatedContent],
    args: {
      siteId: t.arg.string(),
      query: t.arg.string(),
    },
    resolve: async (_, args, ctx) => {
      await assertSitePermission({
        siteId: args.siteId,
        userId: ctx.session.userId,
      });

      const site = await db
        .select({
          teamId: Sites.teamId,
        })
        .from(Sites)
        .where(eq(Sites.id, args.siteId))
        .then(firstOrThrow);

      await assertTeamPlanRule({
        teamId: site.teamId,
        rule: 'aiSearch',
      });

      const chain1 = RunnableSequence.from([
        ChatPromptTemplate.fromMessages([
          ['system', keywordExtractionPrompt],
          ['user', '{query}'],
        ]),

        langchain.model.withStructuredOutput(
          z.object({
            keyword: z.string(),
          }),
        ),
      ]);

      const { keyword } = await chain1.invoke({
        query: args.query,
      });

      const queryVector = await langchain.embeddings.embedQuery(keyword);
      const distance = cosineDistance(PageContentChunks.vector, queryVector);

      const result = await db
        .select({
          id: PageContentChunks.pageId,
          title: PageContents.title,
          subtitle: PageContents.subtitle,
          content: PageContents.content,
          distance,
        })
        .from(PageContentChunks)
        .innerJoin(Pages, eq(Pages.id, PageContentChunks.pageId))
        .innerJoin(PageContents, eq(PageContents.pageId, PageContentChunks.pageId))
        .where(and(eq(Pages.siteId, args.siteId), eq(Pages.state, PageState.PUBLISHED)))
        .orderBy(asc(distance))
        .limit(20)
        .then((rows) => uniqueBy(rows, (row) => row.id));

      return await Promise.all(
        result.map(async (page) => {
          const chain2 = RunnableSequence.from([
            ChatPromptTemplate.fromMessages([
              ['system', fixByChangePrompt],
              ['user', '{context}'],
              ['user', '{query}'],
            ]),

            langchain.model.withStructuredOutput(
              z.object({
                fixes: z.array(
                  z.object({
                    relevance: z.number(),
                    nodeId: z.string(),
                    original: z.string(),
                    suggestion: z.string(),
                    reason: z.string(),
                  }),
                ),
              }),
            ),
          ]);

          const { fixes } = await chain2.invoke({
            context: JSON.stringify({
              title: page.title,
              subtitle: page.subtitle,
              content: page.content,
            }),
            query: args.query,
          });

          return {
            pageId: page.id,
            fixes,
          };
        }),
      ).then((pageFixes) => pageFixes.filter((page) => page.fixes.some((fix) => fix.relevance > 2.5)));
    },
  }),
}));
