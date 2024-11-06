import { getClientAddress } from '@readable/lib';
import { createYoga, useExecutionCancellation } from 'graphql-yoga';
import { Hono } from 'hono';
import { createContext } from '@/context';
import { schema } from '@/graphql';
import { useCache } from './plugins/cache';
import { useError } from './plugins/error';
import { useLogger } from './plugins/logger';

export const yoga = new Hono();

const app = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: '/graphql',
  batching: true,
  cors: false,
  maskedErrors: false,
  landingPage: false,
  plugins: [useExecutionCancellation(), useLogger(), useError(), useCache()],
});

yoga.get('/', (c) => app.handleRequest(c.req.raw, { ip: getClientAddress(c) }));
yoga.post('/', (c) => app.handleRequest(c.req.raw, { ip: getClientAddress(c) }));
