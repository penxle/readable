import { redis } from '@/cache';

export const invalidateSiteCache = async (siteId: string) => {
  const key = `sitecache:${siteId}`;
  await redis.del(key);
  await redis.del(`${key}:orderedPageList`);
};
