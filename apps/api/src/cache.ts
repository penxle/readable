import { Redis } from 'ioredis';
import superjson from 'superjson';
import { env } from '@/env';

export const redis = new Redis(env.REDIS_URL);

export const cached = async <T>(key: string, ttl: number, fn: () => Promise<T>) => {
  const value = await redis.get(key);
  if (value) {
    return superjson.parse(value);
  }

  const v = await fn();
  await redis.setex(key, ttl, superjson.stringify(v));

  return v;
};
