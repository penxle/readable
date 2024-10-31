import { and, eq, gte, lte } from 'drizzle-orm';
import * as R from 'remeda';
import { builder } from '@/builder';
import { db, Pages, PageViews } from '@/db';
import { Site } from './objects';

const DailyVisitor = builder.simpleObject('DailyVisitor', {
  fields: (t) => ({
    date: t.field({ type: 'DateTime' }),
    pageViews: t.int(),
    visitors: t.int(),
  }),
});

builder.objectFields(Site, (t) => ({
  visitors: t.field({
    type: [DailyVisitor],
    args: {
      dateStart: t.arg({ type: 'DateTime' }),
      dateEnd: t.arg({ type: 'DateTime', required: false }),
    },
    resolve: async (site, { dateStart, dateEnd }) => {
      const data = await db
        .select({
          pageId: PageViews.pageId,
          deviceId: PageViews.deviceId,
          createdAt: PageViews.createdAt,
        })
        .from(PageViews)
        .innerJoin(Pages, eq(PageViews.pageId, Pages.id))
        .where(
          and(
            eq(Pages.siteId, site.id),
            gte(PageViews.createdAt, dateStart),
            dateEnd ? lte(PageViews.createdAt, dateEnd) : undefined,
          ),
        )
        .orderBy(PageViews.createdAt);

      return R.pipe(
        data,
        R.splitWhen((pageView, i, data) => {
          if (i === 0) {
            return false;
          }

          return !data[i - 1].createdAt.kst().startOf('day').isSame(pageView.createdAt.kst().startOf('day'), 'day');
        }),
        R.filter((pageViews) => pageViews.length > 0),
        R.map((pageViews) => ({
          date: pageViews[0].createdAt.kst().startOf('day'),
          pageViews: pageViews.length,
          visitors: R.unique(pageViews.map((pageView) => pageView.deviceId)).length,
        })),
      );
    },
  }),
}));
