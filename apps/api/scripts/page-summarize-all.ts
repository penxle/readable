import { and, asc, eq } from 'drizzle-orm';
import { db, Pages, Sites } from '@/db';
import { PageState, SiteState } from '@/enums';
import { enqueueJob } from '@/jobs';

const sites = await db
  .select({ id: Sites.id })
  .from(Sites)
  .where(eq(Sites.state, SiteState.ACTIVE))
  .orderBy(asc(Sites.id));

for (const site of sites) {
  await db.transaction(async (tx) => {
    const pages = await tx
      .select({ pageId: Pages.id })
      .from(Pages)
      .where(and(eq(Pages.siteId, site.id), eq(Pages.state, PageState.PUBLISHED)))
      .orderBy(asc(Pages.id));

    await Promise.all(pages.map((page) => enqueueJob(tx, 'page:summarize', page.pageId)));
  });
}
