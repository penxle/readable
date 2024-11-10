import { createClient, errorExchange } from '@readable/gql';
import { error } from '@sveltejs/kit';
import { ReadableError } from '@/errors';
import { env } from '$env/dynamic/public';

// eslint-disable-next-line import/no-default-export
export default createClient({
  url: `${env.PUBLIC_API_URL}/graphql`,
  headers: () => ({
    'x-rdbl-svc': 'usersite',
  }),
  exchanges: [
    errorExchange((error) => {
      if (error.extensions.type === 'ReadableError') {
        return new ReadableError({
          code: error.extensions.code as string,
          message: error.message,
          status: error.extensions.status as number,
        });
      }

      return error;
    }),
  ],
  onError: (err) => {
    if (err instanceof ReadableError) {
      error(err.status, { code: err.code, message: err.message });
    }
  },
});
