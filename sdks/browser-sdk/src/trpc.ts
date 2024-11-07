import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/trpc';

const url = import.meta.env.PROD ? 'https://api.rdbl.io/trpc' : 'http://localhost:3000/trpc';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url,
      methodOverride: 'POST',
      transformer: superjson,
    }),
  ],
});

export type TRPCInput = inferRouterInputs<AppRouter>;
export type TRPCOutput = inferRouterOutputs<AppRouter>;
