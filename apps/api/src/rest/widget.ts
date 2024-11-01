import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import stringHash from '@sindresorhus/string-hash';
import { and, asc, cosineDistance, eq, inArray } from 'drizzle-orm';
import Elysia, { t } from 'elysia';
import stringify from 'fast-json-stable-stringify';
import { z } from 'zod';
import { redis } from '@/cache';
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

    const hash = stringHash(
      stringify({
        keywords: body.keywords,
        text: body.text,
      }),
    );

    const cacheKey = `widget:v1.2:${site.id}:${hash}`;
    const cached = await redis.get(cacheKey);
    let result: { pages: { id: string; score: number }[] };

    if (cached) {
      await Bun.sleep(1000);
      result = JSON.parse(cached);
    } else {
      const queryVector = await langchain.embeddings.embedQuery(body.keywords.join(' '));

      const distance = cosineDistance(PageContentChunks.vector, queryVector);
      const chunks = await db
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

      if (chunks.length === 0) {
        return {
          site: { id: site.id, name: site.name, url: siteUrl },
          pages: [],
        };
      }

      const chain = RunnableSequence.from([
        ChatPromptTemplate.fromMessages([
          ['system', keywordSearchPrompt],
          ['user', '{context}'],
          ['user', '{keywords}'],
          ['user', '{text}'],
        ]),

        langchain.model.withStructuredOutput(
          z.object({
            pages: z.array(
              z.object({
                id: z.string(),
                score: z.number(),
              }),
            ),
          }),
        ),
      ]);

      result = await chain.invoke({
        context: chunks,
        keywords: body.keywords,
        text: body.text,
      });

      await redis.setex(cacheKey, 60 * 60 * 24, JSON.stringify(result));
    }

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
      site: { id: site.id, name: site.name, url: siteUrl },
      pages: sortedResultPages.map((page) => ({
        ...page,
        score: result.pages.find((p) => p.id === page.id)?.score,
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
