import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { Categories, db, Pages } from '@/db';
import { CategoryState, PageState } from '@/enums';

export const getOrderedPageList = async (siteId: string) => {
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

  return list;
};
