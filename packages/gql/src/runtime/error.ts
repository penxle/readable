import { getClient } from '../client/internal';
import type { LoadEvent } from '@sveltejs/kit';

export const handleError = async (error: unknown, event: LoadEvent) => {
  const { client } = getClient();
  await client.handleError(error, event);
};
