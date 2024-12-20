import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import stringHash from '@sindresorhus/string-hash';
import { TRPCError } from '@trpc/server';
import { and, asc, cosineDistance, count, desc, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import stringify from 'fast-json-stable-stringify';
import { z } from 'zod';
import { redis } from '@/cache';
import {
  AiChatMessages,
  AiChatSessions,
  Categories,
  db,
  first,
  firstOrThrow,
  Images,
  PageContentChunks,
  PageContents,
  Pages,
  PageViews,
  SiteCustomDomains,
  Sites,
  SiteWidgets,
} from '@/db';
import { AiChatMessageRole, PageState, SiteCustomDomainState, SiteState } from '@/enums';
import { env } from '@/env';
import * as langchain from '@/external/langchain';
import { ask } from '@/llms/chat';
import { keywordSearchPrompt } from '@/prompt/widget';
import { assertTeamPlanRule } from '@/utils/plan';
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

    try {
      await assertTeamPlanRule({
        teamId: site.teamId,
        rule: 'widget',
      });
    } catch {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Feature not available' });
    }

    return next({
      ctx: {
        site,
      },
    });
  });

export const widgetRouter = router({
  site: widgetProcedure.query(async ({ ctx }) => {
    let url;
    if (env.USERSITE_OVERRIDE_URL) {
      url = env.USERSITE_OVERRIDE_URL;
    } else {
      const customDomain = await db
        .select({ domain: SiteCustomDomains.domain })
        .from(SiteCustomDomains)
        .where(
          and(eq(SiteCustomDomains.siteId, ctx.site.id), eq(SiteCustomDomains.state, SiteCustomDomainState.ACTIVE)),
        )
        .then(first);

      url = customDomain ? `https://${customDomain.domain}` : `https://${ctx.site.slug}.${env.USERSITE_DEFAULT_HOST}`;
    }

    const logo = ctx.site.logoId
      ? await db
          .select({
            path: Images.path,
          })
          .from(Images)
          .where(eq(Images.id, ctx.site.logoId))
          .then(firstOrThrow)
      : null;

    const widget = await db
      .select({ outLink: SiteWidgets.outLink })
      .from(SiteWidgets)
      .where(eq(SiteWidgets.siteId, ctx.site.id))
      .then(first);

    return {
      id: ctx.site.id,
      name: ctx.site.name,
      themeColor: ctx.site.themeColor,
      url,
      logoUrl: logo ? `${env.PUBLIC_USERCONTENTS_URL}/images/${logo.path}` : null,
      widget: {
        outLink: widget?.outLink,
      },
    };
  }),

  pages: {
    lookup: widgetProcedure
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

          if (chunks.length > 0) {
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
          } else {
            result = {
              pages: [],
            };
          }
        }

        const resultPages = await db
          .select({
            id: PageContents.pageId,
            title: PageContents.title,
            previewText: PageContents.text,
          })
          .from(PageContents)
          .where(
            inArray(
              PageContents.pageId,
              result.pages.filter((page) => page.score >= 0.8).map((page) => page.id),
            ),
          );

        if (resultPages.length === 0) {
          const sq = db.$with('sq').as(
            db
              .select({ id: Pages.id, count: count().as('count') })
              .from(Pages)
              .innerJoin(PageViews, eq(Pages.id, PageViews.pageId))
              .where(and(eq(Pages.siteId, ctx.site.id), eq(Pages.state, PageState.PUBLISHED)))
              .groupBy(Pages.id)
              .orderBy((t) => desc(t.count))
              .limit(5),
          );

          const pages = await db
            .with(sq)
            .select({ id: sq.id, title: PageContents.title, count: sq.count, previewText: PageContents.text })
            .from(sq)
            .innerJoin(PageContents, eq(sq.id, PageContents.pageId))
            .orderBy(desc(sq.count), asc(PageContents.title))
            .limit(5);

          return {
            type: 'fallback' as const,
            pages: pages.map((page) => ({
              id: page.id,
              title: page.title ?? '(제목 없음)',
              previewText: page.previewText.slice(0, 100),
            })),
          };
        }

        const sortedResultPages = resultPages.toSorted(
          (a, b) =>
            result.pages.findIndex((page) => page.id === a.id) - result.pages.findIndex((page) => page.id === b.id),
        );

        return {
          type: 'match' as const,
          pages: sortedResultPages.map((page) => ({
            id: page.id,
            title: page.title ?? '(제목 없음)',
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            score: result.pages.find((p) => p.id === page.id)!.score,
            previewText: page.previewText.slice(0, 100),
          })),
        };
      }),
  },

  page: {
    breadcrumbs: widgetProcedure.input(z.object({ pageId: z.string() })).query(async ({ input }) => {
      const P = alias(Pages, 'p');
      const PC = alias(PageContents, 'pc');

      const { categoryName, parentTitle, title } = await db
        .select({ categoryName: Categories.name, parentTitle: PC.title, title: PageContents.title })
        .from(Pages)
        .innerJoin(Categories, eq(Pages.categoryId, Categories.id))
        .innerJoin(PageContents, eq(Pages.id, PageContents.pageId))
        .leftJoin(P, eq(Pages.parentId, P.id))
        .leftJoin(PC, eq(P.id, PC.pageId))
        .where(eq(Pages.id, input.pageId))
        .then(firstOrThrow);

      return [categoryName, parentTitle, title].filter(Boolean);
    }),
  },

  chat: {
    new: widgetProcedure.mutation(async ({ ctx }) => {
      const session = await db
        .insert(AiChatSessions)
        .values({ siteId: ctx.site.id })
        .returning({ id: AiChatSessions.id })
        .then(firstOrThrow);

      return {
        sessionId: session.id,
      };
    }),

    message: widgetProcedure
      .input(z.object({ sessionId: z.string(), message: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const conversation = await db
          .select({ role: AiChatMessages.role, content: AiChatMessages.content })
          .from(AiChatMessages)
          .where(eq(AiChatMessages.sessionId, input.sessionId))
          .orderBy(asc(AiChatMessages.createdAt));

        await db.insert(AiChatMessages).values({
          sessionId: input.sessionId,
          role: AiChatMessageRole.USER,
          content: input.message,
        });

        const { answer } = await ask({
          siteId: ctx.site.id,
          message: input.message,
          conversation,
        });

        if (answer) {
          await db.insert(AiChatMessages).values({
            sessionId: input.sessionId,
            role: AiChatMessageRole.ASSISTANT,
            content: answer,
          });
        }

        return answer;
      }),
  },
});
