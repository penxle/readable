import dayjs from 'dayjs';
import { and, asc, count, eq } from 'drizzle-orm';
import { builder } from '@/builder';
import { db, first, firstOrThrow, Sites, TeamMemberInvitations, TeamMembers, Teams, Users } from '@/db';
import { sendEmail } from '@/email';
import TeamMemberAddedEmail from '@/email/templates/TeamMemberAdded.tsx';
import TeamMemberInvitedEmail from '@/email/templates/TeamMemberInvited.tsx';
import { SiteState, TeamMemberRole, TeamState, UserState } from '@/enums';
import { env } from '@/env';
import { ApiError } from '@/errors';
import { dataSchemas } from '@/schemas';
import { assertTeamPermission } from '@/utils/permissions';
import { Site, Team, TeamMember, TeamMemberInvitation, User } from './objects';

/**
 * * Types
 */

Team.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),

    members: t.field({
      type: [TeamMember],
      resolve: async (team) => {
        return await db
          .select()
          .from(TeamMembers)
          .where(eq(TeamMembers.teamId, team.id))
          .orderBy(asc(TeamMembers.createdAt));
      },
    }),

    meAsMember: t.field({
      type: TeamMember,
      nullable: true,
      resolve: async (team, _, ctx) => {
        if (!ctx.session) {
          return;
        }

        return await db
          .select()
          .from(TeamMembers)
          .where(and(eq(TeamMembers.teamId, team.id), eq(TeamMembers.userId, ctx.session.userId)))
          .then(first);
      },
    }),

    sites: t.field({
      type: [Site],
      resolve: async (team) => {
        return await db
          .select()
          .from(Sites)
          .where(and(eq(Sites.teamId, team.id), eq(Sites.state, SiteState.ACTIVE)))
          .orderBy(asc(Sites.name));
      },
    }),
  }),
});

TeamMember.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    role: t.expose('role', { type: TeamMemberRole }),

    user: t.field({ type: User, resolve: (member) => member.userId }),
  }),
});

TeamMemberInvitation.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

/**
 * * Queries
 */

builder.queryFields((t) => ({
  team: t.withAuth({ session: true }).field({
    type: Team,
    args: { teamId: t.arg.id() },
    resolve: async (_, args, ctx) => {
      await assertTeamPermission({
        teamId: args.teamId,
        userId: ctx.session.userId,
      });

      return args.teamId;
    },
  }),
}));

/**
 * * Mutations
 */

builder.mutationFields((t) => ({
  createTeam: t.withAuth({ session: true }).fieldWithInput({
    type: Team,
    input: { name: t.input.string({ validate: { schema: dataSchemas.team.name } }) },
    resolve: async (_, { input }, ctx) => {
      return await createTeam(ctx.session.userId, input.name);
    },
  }),

  createDefaultTeam: t.withAuth({ session: true }).field({
    type: Team,
    resolve: async (_, __, ctx) => {
      const user = await db
        .select({ name: Users.name })
        .from(Users)
        .where(eq(Users.id, ctx.session.userId))
        .then(firstOrThrow);

      return await createTeam(ctx.session.userId, `${user.name}의 팀`);
    },
  }),

  deleteTeam: t.withAuth({ session: true }).fieldWithInput({
    type: Team,
    input: { teamId: t.input.string() },
    resolve: async (_, { input }, ctx) => {
      await assertTeamPermission({
        teamId: input.teamId,
        userId: ctx.session.userId,
        role: 'ADMIN',
      });

      const sites = await db
        .select({ id: Sites.id })
        .from(Sites)
        .where(and(eq(Sites.teamId, input.teamId), eq(Sites.state, SiteState.ACTIVE)));

      if (sites.length > 0) {
        throw new ApiError({ code: 'team_has_sites' });
      }

      return await db
        .update(Teams)
        .set({ state: TeamState.DELETED })
        .where(eq(Teams.id, input.teamId))
        .returning()
        .then(firstOrThrow);
    },
  }),

  inviteTeamMember: t.withAuth({ session: true }).fieldWithInput({
    type: t.builder.unionType('InviteTeamMemberResult', {
      types: [TeamMember, TeamMemberInvitation],
      resolveType: (object) => ('expiresAt' in object ? TeamMemberInvitation : TeamMember),
    }),
    input: { teamId: t.input.string(), email: t.input.string({ validate: { schema: dataSchemas.email } }) },
    resolve: async (_, { input }, ctx) => {
      await assertTeamPermission({
        teamId: input.teamId,
        userId: ctx.session.userId,
        role: TeamMemberRole.ADMIN,
      });

      const invitedUser = await db
        .select({ id: Users.id })
        .from(Users)
        .where(and(eq(Users.email, input.email), eq(Users.state, UserState.ACTIVE)))
        .then(first);

      const team = await db
        .select({ name: Teams.name })
        .from(Teams)
        .where(eq(Teams.id, input.teamId))
        .then(firstOrThrow);

      if (invitedUser) {
        const existingMember = await db
          .select({ id: TeamMembers.id })
          .from(TeamMembers)
          .where(and(eq(TeamMembers.teamId, input.teamId), eq(TeamMembers.userId, invitedUser.id)))
          .then(first);

        if (existingMember) {
          throw new ApiError({ code: 'team_member_exists' });
        }

        const member = await db
          .insert(TeamMembers)
          .values({
            teamId: input.teamId,
            userId: invitedUser.id,
            role: TeamMemberRole.MEMBER,
          })
          .onConflictDoNothing()
          .returning()
          .then(firstOrThrow);

        await sendEmail({
          recipient: input.email,
          subject: `[Readable] ${team.name}에 추가되었어요`,
          body: TeamMemberAddedEmail({
            dashboardUrl: env.DASHBOARD_URL,
            teamId: input.teamId,
            teamName: team.name,
          }),
        });

        return member;
      } else {
        const invitation = await db
          .insert(TeamMemberInvitations)
          .values({
            teamId: input.teamId,
            email: input.email,
            expiresAt: dayjs().add(1, 'day'),
          })
          .returning()
          .then(firstOrThrow);

        await sendEmail({
          recipient: input.email,
          subject: `[Readable] ${team.name}에 참여하세요`,
          body: TeamMemberInvitedEmail({
            dashboardUrl: env.DASHBOARD_URL,
            teamName: team.name,
          }),
        });

        return invitation;
      }
    },
  }),

  removeTeamMember: t.withAuth({ session: true }).fieldWithInput({
    type: TeamMember,
    input: { teamId: t.input.string(), userId: t.input.string() },
    resolve: async (_, { input }, ctx) => {
      await assertTeamPermission({
        teamId: input.teamId,
        userId: ctx.session.userId,
        role: input.userId == ctx.session.userId ? TeamMemberRole.MEMBER : TeamMemberRole.ADMIN,
      });

      return await db.transaction(async (tx) => {
        const member = await tx
          .delete(TeamMembers)
          .where(and(eq(TeamMembers.teamId, input.teamId), eq(TeamMembers.userId, input.userId)))
          .returning()
          .then(firstOrThrow);

        const adminCount = await tx
          .select({ count: count(TeamMembers.id) })
          .from(TeamMembers)
          .where(and(eq(TeamMembers.teamId, input.teamId), eq(TeamMembers.role, TeamMemberRole.ADMIN)))
          .then(first);

        if (adminCount?.count === 0) {
          throw new ApiError({ code: 'team_needs_admin' });
        }

        return member;
      });
    },
  }),

  updateTeamMemberRole: t.withAuth({ session: true }).fieldWithInput({
    type: TeamMember,
    input: {
      teamId: t.input.string(),
      userId: t.input.string(),
      role: t.input.field({ type: TeamMemberRole }),
    },
    resolve: async (_, { input }, ctx) => {
      await assertTeamPermission({
        teamId: input.teamId,
        userId: ctx.session.userId,
        role: TeamMemberRole.ADMIN,
      });

      return await db.transaction(async (tx) => {
        const member = await tx
          .update(TeamMembers)
          .set({ role: input.role })
          .where(and(eq(TeamMembers.teamId, input.teamId), eq(TeamMembers.userId, input.userId)))
          .returning()
          .then(firstOrThrow);

        const adminCount = await tx
          .select({ count: count(TeamMembers.id) })
          .from(TeamMembers)
          .where(and(eq(TeamMembers.teamId, input.teamId), eq(TeamMembers.role, TeamMemberRole.ADMIN)))
          .then(first);

        if (adminCount?.count === 0) {
          throw new ApiError({ code: 'team_needs_admin' });
        }

        return member;
      });
    },
  }),
}));

/**
 * * Utils
 */

const createTeam = async (userId: string, teamName: string) => {
  return await db.transaction(async (tx) => {
    const team = await tx.insert(Teams).values({ name: teamName }).returning().then(firstOrThrow);

    await tx.insert(TeamMembers).values({
      teamId: team.id,
      userId,
      role: TeamMemberRole.ADMIN,
    });

    return team;
  });
};