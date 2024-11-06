import '@/instrument';
import '@readable/lib/dayjs';
import '@/jobs';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { yoga } from '@/handler';
import { hono } from '@/rest';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: (origin) => origin,
    credentials: true,
  }),
);

app.route('/', hono);
app.route('/graphql', yoga);

const server = Bun.serve({
  fetch: app.fetch,
  port: 3000,
  idleTimeout: 0,
});

console.log(`Listening on ${server.url}`);
