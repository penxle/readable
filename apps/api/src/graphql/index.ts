import './objects';
import './enums';
import './analytics';
import './auth';
import './blob';
import './feedback';
import './page';
import './payment';
import './plan';
import './search';
import './site';
import './team';
import './unfurl';
import './uptodate';
import './user';

import { builder } from '@/builder';
import { dev } from '@/env';

export const schema = builder.toSchema();

if (dev) {
  const { writeFileSync } = await import('node:fs');
  const { lexicographicSortSchema, printSchema } = await import('graphql');
  writeFileSync('schema.graphql', `${printSchema(lexicographicSortSchema(schema))}\n`);
}
