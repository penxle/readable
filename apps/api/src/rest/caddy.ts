import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db, first, SiteCustomDomains } from '@/db';
import { SiteCustomDomainState } from '@/enums';
import { env } from '@/env';

export const caddy = new Hono();

caddy.get('/tls', async (c) => {
  const domain = c.req.query('domain');
  if (!domain) {
    throw new HTTPException(400);
  }

  if (domain === env.USERSITE_CNAME_HOST) {
    return c.body(null);
  }

  const siteCustomDomain = await db
    .select({ id: SiteCustomDomains.id })
    .from(SiteCustomDomains)
    .where(and(eq(SiteCustomDomains.domain, domain), eq(SiteCustomDomains.state, SiteCustomDomainState.ACTIVE)))
    .then(first);

  if (!siteCustomDomain) {
    throw new HTTPException(412);
  }

  return c.body(null);
});
