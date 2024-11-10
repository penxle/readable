import { count, desc, eq } from 'drizzle-orm';
import { pgView, QueryBuilder } from 'drizzle-orm/pg-core';
import { Pages, PageViews, Sites } from './tables';

const qb = new QueryBuilder();

export const SiteViews = pgView('site_views').as(
  qb
    .select({
      id: Sites.id,
      name: Sites.name,
      viewCount: count().as('view_count'),
    })
    .from(Sites)
    .innerJoin(Pages, eq(Pages.siteId, Sites.id))
    .innerJoin(PageViews, eq(PageViews.pageId, Pages.id))
    .groupBy(Sites.id)
    .orderBy((t) => desc(t.viewCount)),
);
