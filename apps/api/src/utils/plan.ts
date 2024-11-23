import { and, count, eq, getTableColumns, inArray } from 'drizzle-orm';
import { db, firstOrThrow, Plans, Sites, TeamMembers, TeamPlans } from '@/db';
import { defaultPlanRules } from '@/db/schemas/json';
import { SiteState } from '@/enums';
import { ReadableError } from '@/errors';
import type { Context } from '@/context';
import type { PlanRules } from '@/db/schemas/json';

type GetPlanParams<T extends keyof PlanRules> = {
  teamId: string;
  rule: T;
  ctx?: Context;
};

export const getTeamPlanRule = async <T extends keyof PlanRules>({
  teamId,
  rule,
  ctx,
}: GetPlanParams<T>): Promise<PlanRules[T]> => {
  const plan = await (async () => {
    if (ctx) {
      const planLoader = ctx.loader({
        name: 'Plans&TeamPlans.teamId(teamId)',
        load: async (teamIds: string[]) => {
          return await db
            .select({ ...getTableColumns(Plans), teamId: TeamPlans.teamId })
            .from(TeamPlans)
            .innerJoin(Plans, eq(TeamPlans.planId, Plans.id))
            .where(inArray(TeamPlans.teamId, teamIds));
        },
        key: (row) => row.teamId,
      });

      return await planLoader.load(teamId);
    } else {
      return await db
        .select({ rules: Plans.rules })
        .from(Plans)
        .innerJoin(TeamPlans, eq(TeamPlans.planId, Plans.id))
        .where(eq(TeamPlans.teamId, teamId))
        .then(firstOrThrow);
    }
  })();
  return plan.rules[rule] === undefined ? defaultPlanRules[rule] : plan.rules[rule];
};

export const assertTeamPlanRule = async <T extends keyof PlanRules>(params: GetPlanParams<T>) => {
  const value = await getTeamPlanRule(params);
  if (value === null) {
    return;
  }

  switch (params.rule) {
    case 'aiSearch':
    case 'widget': {
      if (!value) {
        throw new ReadableError({ code: 'feature_not_available' });
      }
      break;
    }

    case 'siteLimit': {
      const siteCount = await db
        .select({ count: count(Sites.id) })
        .from(Sites)
        .where(and(eq(Sites.teamId, params.teamId), eq(Sites.state, SiteState.ACTIVE)))
        .then((rows) => rows[0]?.count ?? 0);

      if (siteCount >= (value as number)) {
        throw new ReadableError({ code: 'site_limit_exceeded' });
      }
      break;
    }

    case 'memberLimit': {
      const memberCount = await db
        .select({ count: count(TeamMembers.id) })
        .from(TeamMembers)
        .where(eq(TeamMembers.teamId, params.teamId))
        .then((rows) => rows[0]?.count ?? 0);

      if (memberCount >= (value as number)) {
        throw new ReadableError({ code: 'member_limit_exceeded' });
      }
      break;
    }

    default: {
      if (!value) {
        throw new ReadableError({ code: 'feature_not_available' });
      }
      break;
    }
  }
};
