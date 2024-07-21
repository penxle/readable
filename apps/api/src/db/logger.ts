import { logger } from '@/logging';
import type { Logger } from 'drizzle-orm/logger';

export class DrizzleLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    const interpolatedQuery = query
      .replaceAll(/\$(\d+)/g, (_, a) => {
        const param = params[a - 1];
        return typeof param === 'string' ? `'${param}'` : String(param);
      })
      .replaceAll('"', '');

    logger.trace({
      scope: 'database',
      query: interpolatedQuery,
    });
  }
}
