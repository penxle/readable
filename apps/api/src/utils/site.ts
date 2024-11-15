import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { redis } from '@/cache';
import { Categories, db, Pages } from '@/db';
import { CategoryState, PageState } from '@/enums';

let runningPromise: Promise<{ id: string }[]> | null = null;

export const getOrderedPageList = (siteId: string) => {
  if (runningPromise === null) {
    runningPromise = getOrderedPageListInternal(siteId)
      .then((list) => {
        return list;
      })
      .finally(() => {
        runningPromise = null;
      });
  }

  return runningPromise;
};

const getOrderedPageListInternal = async (siteId: string) => {
  const cached = await redis.get(`sitecache:${siteId}:orderedPageList`);
  if (cached !== null) {
    return JSON.parse(cached);
  }

  const c = alias(Categories, 'c');
  const p = alias(Pages, 'p');

  const list = (await db.execute(
    sql<{ id: string }[]>`
    WITH RECURSIVE sq AS (
      SELECT
        'C' AS type,
        c.id AS id,
        NULL AS parent_id,
        c.order AS order,
        ARRAY[c.order] AS path
      FROM categories AS c
      WHERE ${and(eq(c.siteId, siteId), eq(c.state, CategoryState.ACTIVE))}
      UNION ALL    
      SELECT 
        'P' AS type,
        p.id AS id,
        CASE 
          WHEN p.parent_id IS NOT NULL
            THEN p.parent_id
            ELSE p.category_id
        END AS parent_id,
        p.order AS order,
        sq.path || p.order AS path
      FROM sq
      JOIN pages AS p ON (sq.type = 'C' AND p.category_id = sq.id AND p.parent_id IS NULL) OR (sq.type = 'P' AND p.parent_id = sq.id)
      WHERE ${eq(p.state, PageState.PUBLISHED)}
    )
    SELECT sq.id
    FROM sq
    WHERE type = 'P'
    ORDER BY sq.path ASC;`,
  )) as { id: string }[];

  await redis.set(`sitecache:${siteId}:orderedPageList`, JSON.stringify(list));

  return list;
};
