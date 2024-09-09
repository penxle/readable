import { and, cosineDistance, desc, eq, gt, sql } from 'drizzle-orm';
import DOMPurify from 'isomorphic-dompurify';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { builder } from '@/builder';
import { db, PageContentChunks, PageContents, Pages } from '@/db';
import { PageState } from '@/enums';
import * as openai from '@/external/openai';
import { fixByChangePrompt } from '@/prompt/fix-by-change';
import { searchIndex } from '@/search';
import { assertSitePermission } from '@/utils/permissions';
import { Page, PublicPage } from './objects';

type PageSearchData = {
  id: string;
  title?: string;
  subtitle?: string;
  text: string;
};

const sanitizeHtmlOnlyEm = (dirty: string | undefined) => {
  return dirty
    ? DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['em'],
      })
    : undefined;
};

const PageSearchHighlight = builder.objectRef<Partial<PageSearchData>>('PageSearchHighlight');
PageSearchHighlight.implement({
  fields: (t) => ({
    title: t.string({ nullable: true, resolve: (highlight) => sanitizeHtmlOnlyEm(highlight.title) }),
    subtitle: t.string({ nullable: true, resolve: (highlight) => sanitizeHtmlOnlyEm(highlight.subtitle) }),
    text: t.string({ nullable: true, resolve: (highlight) => sanitizeHtmlOnlyEm(highlight.text) }),
  }),
});

type SearchResult = {
  id: string;
  _formatted?: Partial<PageSearchData>;
};

const IPageSearchHit = builder.interfaceRef<SearchResult>('IPageSearchHit');
IPageSearchHit.implement({
  fields: (t) => ({
    highlight: t.expose('_formatted', { type: PageSearchHighlight, nullable: true }),
  }),
});

const PageSearchHit = builder.objectRef<SearchResult>('PageSearchHit');
PageSearchHit.implement({
  interfaces: [IPageSearchHit],
  fields: (t) => ({
    page: t.field({ type: Page, resolve: (page) => page.id }),
  }),
});

const PublicPageSearchHit = builder.objectRef<SearchResult>('PublicPageSearchHit');
PublicPageSearchHit.implement({
  interfaces: [IPageSearchHit],
  fields: (t) => ({
    page: t.field({ type: PublicPage, resolve: (page) => page.id }),
  }),
});

type CountableSearchResult<T> = {
  estimatedTotalHits: number;
  hits: T[];
};

const SearchPageResult = builder.objectRef<CountableSearchResult<SearchResult>>('SearchPageResult');
SearchPageResult.implement({
  fields: (t) => ({
    estimatedTotalHits: t.exposeInt('estimatedTotalHits'),
    hits: t.field({ type: [PageSearchHit], resolve: (searchResult) => searchResult.hits }),
  }),
});

const SearchPublicPageResult = builder.objectRef<CountableSearchResult<SearchResult>>('SearchPublicPageResult');
SearchPublicPageResult.implement({
  fields: (t) => ({
    estimatedTotalHits: t.exposeInt('estimatedTotalHits'),
    hits: t.field({ type: [PublicPageSearchHit], resolve: (searchResult) => searchResult.hits }),
  }),
});

type SearchPageByChangeHit = {
  pageId: string;
  fixes: {
    text: string;
    severity: 'WARNING' | 'ERROR';
    reason: string;
    completion: string;
  }[];
};

const FixSeverity = builder.enumType('FixSeverity', {
  values: ['WARNING', 'ERROR'],
});

const SearchPageByChangeHit = builder.objectRef<SearchPageByChangeHit>('SearchPageByChangeHit');
SearchPageByChangeHit.implement({
  fields: (t) => ({
    page: t.field({ type: Page, resolve: (hit) => hit.pageId }),
    fixes: t.field({
      type: [
        builder.simpleObject('SearchPageByChangeFix', {
          fields: (t) => ({
            text: t.string(),
            severity: t.field({ type: FixSeverity }),
            reason: t.string(),
            completion: t.string(),
          }),
        }),
      ],
      resolve: (hit) => hit.fixes,
    }),
  }),
});

builder.queryFields((t) => ({
  searchPage: t.withAuth({ session: true }).field({
    type: SearchPageResult,
    args: {
      siteId: t.arg.string(),
      query: t.arg.string(),
    },
    resolve: async (_, args, ctx) => {
      await assertSitePermission({
        siteId: args.siteId,
        userId: ctx.session.userId,
      });

      const result = await searchIndex('pages').search<PageSearchData>(args.query, {
        attributesToCrop: ['*'],
        attributesToHighlight: ['*'],
        filter: [`siteId = ${args.siteId}`],
      });

      return result;
    },
  }),

  searchPageByChange: t.withAuth({ session: true }).field({
    type: [SearchPageByChangeHit],
    args: {
      siteId: t.arg.string(),
      query: t.arg.string(),
    },
    resolve: async (_, args, ctx) => {
      await assertSitePermission({
        siteId: args.siteId,
        userId: ctx.session.userId,
      });

      const queryVector = await openai.client.embeddings
        .create({
          model: 'text-embedding-3-small',
          input: args.query,
        })
        .then((response) => response.data[0].embedding);

      const similarity = sql<number>`1 - (${cosineDistance(PageContentChunks.vector, queryVector)})`;

      const result = await db
        .select({
          pageId: PageContentChunks.pageId,
          similarity,
          title: PageContents.title,
          subtitle: PageContents.subtitle,
          text: PageContents.text,
        })
        .from(PageContentChunks)
        .innerJoin(Pages, eq(Pages.id, PageContentChunks.pageId))
        .innerJoin(PageContents, eq(PageContents.pageId, PageContentChunks.pageId))
        .where(and(eq(Pages.siteId, args.siteId), eq(Pages.state, PageState.PUBLISHED), gt(similarity, 0.35)))
        .orderBy(desc(similarity))
        .limit(10);

      return await Promise.all(
        result.map(async (page) => {
          const llmResult = await openai.client.beta.chat.completions
            .parse({
              model: 'gpt-4o-2024-08-06',
              temperature: 0.5,
              max_tokens: 4096,
              response_format: zodResponseFormat(
                z.object({
                  fixes: z.array(
                    z.object({
                      severity: z.enum(['WARNING', 'ERROR']),
                      text: z.string(),
                      reason: z.string(),
                      completion: z.string(),
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
                    text: page.text,
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
      ).then((pageFixes) => pageFixes.filter((page) => page.fixes.length > 0));
    },
  }),

  searchPublicPage: t.withAuth({ site: true }).field({
    type: SearchPublicPageResult,
    args: { query: t.arg.string() },
    resolve: async (_, args, ctx) => {
      const result = await searchIndex('pages').search<PageSearchData>(args.query, {
        attributesToCrop: ['*'],
        attributesToHighlight: ['*'],
        filter: [`siteId = ${ctx.site.id}`, `state = ${PageState.PUBLISHED}`],
      });

      return result;
    },
  }),
}));
