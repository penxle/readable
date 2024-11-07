import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import stringHash from '@sindresorhus/string-hash';
import { TRPCError } from '@trpc/server';
import { and, asc, cosineDistance, eq, inArray } from 'drizzle-orm';
import stringify from 'fast-json-stable-stringify';
import { z } from 'zod';
import { redis } from '@/cache';
import {
  db,
  first,
  firstOrThrow,
  Images,
  PageContentChunks,
  PageContents,
  Pages,
  SiteCustomDomains,
  Sites,
} from '@/db';
import { PageState, SiteCustomDomainState, SiteState } from '@/enums';
import { env } from '@/env';
import * as langchain from '@/external/langchain';
import { ask } from '@/llms/chat';
import { keywordSearchPrompt } from '@/prompt/widget';
import { publicProcedure, router } from './trpc';

const widgetProcedure = publicProcedure
  .input(
    z.object({
      siteId: z.string(),
    }),
  )
  .use(async ({ input, next }) => {
    const site = await db
      .select()
      .from(Sites)
      .where(and(eq(Sites.id, input.siteId), eq(Sites.state, SiteState.ACTIVE)))
      .then(first);

    if (!site) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Site not found' });
    }

    return next({
      ctx: {
        site,
      },
    });
  });

export const widgetRouter = router({
  site: widgetProcedure.query(async ({ ctx }) => {
    const customDomain = await db
      .select({
        domain: SiteCustomDomains.domain,
      })
      .from(SiteCustomDomains)
      .where(and(eq(SiteCustomDomains.siteId, ctx.site.id), eq(SiteCustomDomains.state, SiteCustomDomainState.ACTIVE)))
      .then(first);

    const logo = ctx.site.logoId
      ? await db
          .select({
            path: Images.path,
          })
          .from(Images)
          .where(eq(Images.id, ctx.site.logoId))
          .then(firstOrThrow)
      : null;

    return {
      id: ctx.site.id,
      name: ctx.site.name,
      themeColor: ctx.site.themeColor,
      url: customDomain ? `https://${customDomain.domain}` : `https://${ctx.site.slug}.${env.USERSITE_DEFAULT_HOST}`,
      logoUrl: logo ? `${env.PUBLIC_USERCONTENTS_URL}/images/${logo.path}` : null,
    };
  }),

  findRelatedPages: widgetProcedure
    .input(
      z.object({
        keywords: z.array(z.string()),
        text: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const hash = stringHash(
        stringify({
          keywords: input.keywords,
          text: input.text,
        }),
      );

      const cacheKey = `widget:v1.2:${ctx.site.id}:${hash}`;
      const cached = await redis.get(cacheKey);
      let result: { pages: { id: string; score: number }[] };

      if (cached) {
        await Bun.sleep(1000);
        result = JSON.parse(cached);
      } else {
        const vector = await langchain.embeddings.embedQuery(input.keywords.join(' '));
        const distance = cosineDistance(PageContentChunks.vector, vector);

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
          .where(and(eq(Pages.siteId, ctx.site.id), eq(Pages.state, PageState.PUBLISHED)))
          .orderBy(asc(distance))
          .limit(5);

        if (chunks.length === 0) {
          return {
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
          keywords: input.keywords,
          text: input.text,
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
        (a, b) =>
          result.pages.findIndex((page) => page.id === a.id) - result.pages.findIndex((page) => page.id === b.id),
      );

      return {
        pages: sortedResultPages.map((page) => ({
          id: page.id,
          title: page.title ?? '(제목 없음)',
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          score: result.pages.find((p) => p.id === page.id)!.score,
        })),
      };
    }),

  chat: widgetProcedure
    .input(z.object({ threadId: z.string(), question: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ask({
        threadId: input.threadId,
        siteId: ctx.site.id,
        question: input.question,
      });
    }),
});
