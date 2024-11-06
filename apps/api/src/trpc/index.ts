import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { router } from './trpc';
import { widgetRouter } from './widget';

export const trpc = new Hono();

const appRouter = router({
  widget: widgetRouter,
});

trpc.use(
  '*',
  trpcServer({
    router: appRouter,
  }),
);

export type AppRouter = typeof appRouter;
