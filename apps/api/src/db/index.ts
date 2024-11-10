import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/env';
import { DrizzleLogger } from './logger';
import * as enums from './schemas/enums';
import * as tables from './schemas/tables';
import type { PgDatabase, PgTransaction } from 'drizzle-orm/pg-core';

export const pg = postgres(env.DATABASE_URL, { max: 20 });
export const db = drizzle(pg, { schema: { ...tables, ...enums }, logger: new DrizzleLogger() });

export type Database = typeof db;
export type Transaction = Database extends PgDatabase<infer T, infer U, infer V> ? PgTransaction<T, U, V> : never;

export * from './schemas/id';
export * from './schemas/tables';
export * from './schemas/views';
export * from './utils';
