import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { db, SiteLogs } from '@/db';

export const logs = new Hono();

type LogBody = {
  siteId: string;
  kind: string;
  deviceId: string;
  data?: unknown;
};

logs.post('/', async (c) => {
  const { siteId, kind, deviceId, data } = await c.req.json<LogBody>();
  if (!siteId || !kind || !deviceId) {
    throw new HTTPException(400);
  }

  await db.insert(SiteLogs).values({ siteId, kind, deviceId, data });

  return c.json({ success: true });
});
