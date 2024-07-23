import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { parse, stringify } from 'devalue';
import { env } from '$env/dynamic/public';
import type { LoadEvent, ServerLoadEvent } from '@sveltejs/kit';
import type { AppRouter } from '@/router';

export const trpcS = (event: LoadEvent | ServerLoadEvent) => {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.PUBLIC_API_URL}/trpc`,
        transformer: {
          serialize: stringify,
          deserialize: parse,
        },
        fetch: event.fetch,
      }),
    ],
  });
};