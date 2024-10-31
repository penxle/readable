import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { and, asc, cosineDistance, eq, inArray } from 'drizzle-orm';
import Elysia, { t } from 'elysia';
import { z } from 'zod';
import { db, firstOrThrow, PageContentChunks, PageContents, Pages, Sites } from '@/db';
import { PageState, SiteState } from '@/enums';
import { env } from '@/env';
import * as langchain from '@/external/langchain';
import { keywordSearchPrompt } from '@/prompt/widget';

export const widget = new Elysia({ prefix: '/widget' });

widget.post(
  '/query',
  async ({ body }) => {
    const site = await db
      .select({ id: Sites.id, name: Sites.name, slug: Sites.slug })
      .from(Sites)
      .where(and(eq(Sites.id, body.siteId), eq(Sites.state, SiteState.ACTIVE)))
      .then(firstOrThrow);

    const siteUrl = `https://${site.slug}.${env.USERSITE_DEFAULT_HOST}`;

    const input = body.keywords.join(' ');
    const queryVector = await langchain.embeddings.embedQuery(input);

    const distance = cosineDistance(PageContentChunks.vector, queryVector);
    const pages = await db
      .select({
        id: Pages.id,
        title: PageContents.title,
        text: PageContents.text,
        distance,
      })
      .from(Pages)
      .innerJoin(PageContents, eq(Pages.id, PageContents.pageId))
      .innerJoin(PageContentChunks, eq(Pages.id, PageContentChunks.pageId))
      .where(and(eq(Pages.siteId, site.id), eq(Pages.state, PageState.PUBLISHED)))
      .orderBy(asc(distance))
      .limit(5);

    if (pages.length === 0) {
      return {
        site: {
          id: site.id,
          name: site.name,
          url: siteUrl,
        },
        pages: [],
      };
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', keywordSearchPrompt],
      ['user', '{context}'],
      ['user', '{keywords}'],
      ['user', '{text}'],
    ]);

    const model = langchain.model.withStructuredOutput(
      z.object({
        pages: z.array(
          z.object({
            id: z.string(),
            score: z.number(),
          }),
        ),
      }),
    );

    const chain = RunnableSequence.from([prompt, model]);

    const result = await chain.invoke({
      context: pages,
      keywords: body.keywords,
      text: body.text,
    });

    const resultPages = await db
      .select({
        id: PageContents.pageId,
        title: PageContents.title,
      })
      .from(PageContents)
      .where(
        inArray(
          PageContents.pageId,
          result.pages.map((page) => page.id),
        ),
      );

    const sortedResultPages = resultPages.toSorted(
      (a, b) => result.pages.findIndex((page) => page.id === a.id) - result.pages.findIndex((page) => page.id === b.id),
    );

    return {
      site: {
        id: site.id,
        name: site.name,
        url: siteUrl,
      },
      pages: sortedResultPages.map((page) => ({
        ...page,
        score: result.pages.find((page) => page.id === page.id)?.score,
      })),
    };
  },
  {
    body: t.Object({
      siteId: t.String(),
      keywords: t.Array(t.String()),
      text: t.String(),
    }),
  },
);
