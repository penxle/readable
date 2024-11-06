import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@/trpc';

const url = import.meta.env.PROD ? 'https://api.rdbl.io/trpc' : 'http://localhost:3000/trpc';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url,
    }),
  ],
});

export type TRPCInput = inferRouterInputs<AppRouter>;
export type TRPCOutput = inferRouterOutputs<AppRouter>;
