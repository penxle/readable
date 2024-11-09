import { GraphQLError } from 'graphql';
import { filter, from, merge, mergeMap, takeUntil } from 'rxjs';
import type { $StoreSchema } from '../types';
import type { Exchange, Operation } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toGraphQLError = (error: any) => {
  const { message, path, extensions } = error;
  return new GraphQLError(message ?? '', { path, extensions });
};

async function* request<T extends $StoreSchema>(op: Operation<T>) {
  const { schema, variables, context } = op;
  const { name, source } = schema;

  const fetch = context?.fetch ?? globalThis.fetch;

  try {
    const response = await fetch(context.url, {
      ...context.fetchOpts,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...context.fetchOpts?.headers,
      },
      body: JSON.stringify({
        operationName: name,
        query: source,
        variables,
        extensions: context.extensions,
      }),
    });

    const body = (await response.json()) as {
      data: T['$output'] | null;
      errors?: unknown[];
    };

    if (body.errors) {
      yield {
        type: 'error' as const,
        operation: op,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errors: body.errors.map((v: any) => toGraphQLError(v)),
      };
    } else {
      yield {
        type: 'data' as const,
        operation: op,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        data: body.data!,
      };
    }
  } catch (err) {
    yield {
      type: 'error' as const,
      operation: op,
      errors: [new GraphQLError('Network error', { originalError: err as Error })],
    };
  }
}

export const fetchExchange: Exchange = ({ forward }) => {
  return (ops$) => {
    const fetch$ = ops$.pipe(
      filter((operation) => operation.type === 'query' || operation.type === 'mutation'),
      mergeMap((operation) => {
        const teardown$ = ops$.pipe(filter((op) => op.type === 'teardown' && op.key === operation.key));

        return from(request(operation)).pipe(takeUntil(teardown$));
      }),
    );

    const forward$ = ops$.pipe(
      filter((op) => op.type !== 'query' && op.type !== 'mutation'),
      forward,
    );

    return merge(fetch$, forward$);
  };
};
