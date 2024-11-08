import stringHash from '@sindresorhus/string-hash';
import { Cron } from 'croner';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db, first } from '@/db';
import { dev, env } from '@/env';
import { TestCron } from './test';

const crons = [TestCron];

const _crons = crons.map((cron) => new Cron(cron.pattern, { paused: true, timezone: 'Asia/Seoul' }, cron.fn));

const key = stringHash(dev ? `jobs:cron:${nanoid()}` : `jobs:cron:${env.PUBLIC_PULUMI_STACK}`);

const tryAcquireLock = async () => {
  const res = await db
    .execute<{ locked: boolean }>(sql`SELECT pg_try_advisory_lock(${key}) as locked -- @silent@`)
    .then(first);

  return res?.locked ?? false;
};

let leader = false;

const loop = async () => {
  const acquired = await tryAcquireLock();

  if (acquired && !leader) {
    leader = true;

    for (const cron of _crons) {
      cron.resume();
    }
  } else if (!acquired && leader) {
    leader = false;

    for (const cron of _crons) {
      cron.pause();
    }
  }

  setTimeout(loop, 1000);
};

loop();
