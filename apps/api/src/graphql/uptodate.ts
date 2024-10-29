import { and, cosineDistance, desc, eq, sql } from 'drizzle-orm';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { uniqueBy } from 'remeda';
import { z } from 'zod';
import { builder } from '@/builder';
import { db, firstOrThrow, PageContentChunks, PageContents, Pages, Sites } from '@/db';
import { PageState } from '@/enums';
import * as openai from '@/external/openai';
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

      const keyword = await openai.client.beta.chat.completions
        .parse({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: keywordExtractionPrompt,
            },
            {
              role: 'user',
              content: JSON.stringify({
                change: args.query,
              }),
            },
          ],
          response_format: zodResponseFormat(
            z.object({
              keyword: z.string(),
            }),
            'keyword',
          ),
        }) // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .then((response) => response.choices[0].message.parsed!.keyword);

      const queryVector = await openai.client.embeddings
        .create({
          model: 'text-embedding-3-small',
          input: keyword,
        })
        .then((response) => response.data[0].embedding);

      const similarity = sql<number>`1 - (${cosineDistance(PageContentChunks.vector, queryVector)})`;

      const result = await db
        .select({
          pageId: PageContentChunks.pageId,
          similarity,
          title: PageContents.title,
          subtitle: PageContents.subtitle,
          content: PageContents.content,
        })
        .from(PageContentChunks)
        .innerJoin(Pages, eq(Pages.id, PageContentChunks.pageId))
        .innerJoin(PageContents, eq(PageContents.pageId, PageContentChunks.pageId))
        .where(and(eq(Pages.siteId, args.siteId), eq(Pages.state, PageState.PUBLISHED)))
        .orderBy(desc(similarity))
        .limit(20)
        .then((rows) => uniqueBy(rows, (row) => row.pageId))
        .then((rows) => rows.filter((row) => row.similarity > rows[0].similarity * 0.6));

      return await Promise.all(
        result.map(async (page) => {
          const llmResult = await openai.client.beta.chat.completions
            .parse({
              model: 'gpt-4o',
              temperature: 0.5,
              max_tokens: 4096,
              response_format: zodResponseFormat(
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
                'fixes',
              ),
              messages: [
                {
                  role: 'system',
                  content: fixByChangePrompt,
                },
                {
                  role: 'user',
                  content: JSON.stringify({
                    title: page.title,
                    subtitle: page.subtitle,
                    content: page.content,
                  }),
                },
                {
                  role: 'user',
                  content: JSON.stringify({
                    change: args.query,
                  }),
                },
              ],
            })
            .then((response) => response.choices[0].message.parsed?.fixes ?? []);

          return {
            pageId: page.pageId,
            fixes: llmResult,
          };
        }),
      ).then((pageFixes) => pageFixes.filter((page) => page.fixes.some((fix) => fix.relevance > 2.5)));
    },
  }),
}));
