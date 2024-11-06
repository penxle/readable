import { Hono } from 'hono';

export const healthz = new Hono();

healthz.get('/', (c) => {
  return c.json({ '*': true });
});
