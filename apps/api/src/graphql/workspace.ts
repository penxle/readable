import { TRPCError } from '@trpc/server';
import dayjs from 'dayjs';
import { and, asc, count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, first, firstOrThrow, Sites, Users, WorkspaceMemberInvitations, WorkspaceMembers, Workspaces } from '@/db';
import { sendEmail } from '@/email';
import WorkspaceMemberAddedEmail from '@/email/templates/WorkspaceMemberAdded.tsx';
import WorkspaceMemberInvitedEmail from '@/email/templates/WorkspaceMemberInvited.tsx';
import { SiteState, UserState, WorkspaceMemberRole, WorkspaceState } from '@/enums';
import { env } from '@/env';
import { inputSchemas } from '@/schemas';
import { router, sessionProcedure } from '@/trpc';
import { assertWorkspacePermission } from '@/utils/permissions';

const createWorkspace = async (userId: string, workspaceName: string) => {
  return await db.transaction(async (tx) => {
    const workspace = await tx
      .insert(Workspaces)
      .values({ name: workspaceName })
      .returning({ id: Workspaces.id })
      .then(firstOrThrow);

    await tx.insert(WorkspaceMembers).values({
      workspaceId: workspace.id,
      userId,
      role: WorkspaceMemberRole.ADMIN,
    });

    return workspace;
  });
};

export const workspaceRouter = router({
  create: sessionProcedure.input(inputSchemas.workspace.create).mutation(async ({ input, ctx }) => {
    return await createWorkspace(ctx.session.userId, input.name);
  }),

  createDefault: sessionProcedure.mutation(async ({ ctx }) => {
    const user = await db
      .select({ name: Users.name })
      .from(Users)
      .where(eq(Users.id, ctx.session.userId))
      .then(firstOrThrow);

    const name = `${user.name}의 워크스페이스`;

    return await createWorkspace(ctx.session.userId, name);
  }),

  list: sessionProcedure.query(async ({ ctx }) => {
    return await db
      .select({ id: Workspaces.id, name: Workspaces.name })
      .from(Workspaces)
      .innerJoin(WorkspaceMembers, eq(Workspaces.id, WorkspaceMembers.workspaceId))
      .where(and(eq(WorkspaceMembers.userId, ctx.session.userId), eq(Workspaces.state, WorkspaceState.ACTIVE)))
      .orderBy(asc(Workspaces.createdAt));
  }),

  hasAny: sessionProcedure.query(async ({ ctx }) => {
    const workspace = await db
      .select({ id: Workspaces.id })
      .from(Workspaces)
      .innerJoin(WorkspaceMembers, eq(Workspaces.id, WorkspaceMembers.workspaceId))
      .where(and(eq(WorkspaceMembers.userId, ctx.session.userId), eq(Workspaces.state, WorkspaceState.ACTIVE)))
      .limit(1)
      .then(first);

    return !!workspace;
  }),

  delete: sessionProcedure.input(z.object({ workspaceId: z.string() })).mutation(async ({ input, ctx }) => {
    await assertWorkspacePermission({
      workspaceId: input.workspaceId,
      userId: ctx.session.userId,
      role: 'ADMIN',
    });

    const sites = await db
      .select({ id: Sites.id })
      .from(Sites)
      .where(and(eq(Sites.workspaceId, input.workspaceId), eq(Sites.state, SiteState.ACTIVE)));

    if (sites.length > 0) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: '아직 운영중인 사이트가 남아있어요',
      });
    }

    await db.update(Workspaces).set({ state: WorkspaceState.DELETED }).where(eq(Workspaces.id, input.workspaceId));
  }),

  listMembers: sessionProcedure.input(z.object({ workspaceId: z.string() })).query(async ({ input, ctx }) => {
    await assertWorkspacePermission({
      workspaceId: input.workspaceId,
      userId: ctx.session.userId,
    });

    return await db
      .select({
        id: Users.id,
        name: Users.name,
        email: Users.email,
        avatarUrl: Users.avatarUrl,
        role: WorkspaceMembers.role,
      })
      .from(WorkspaceMembers)
      .innerJoin(Users, eq(WorkspaceMembers.userId, Users.id))
      .where(eq(WorkspaceMembers.workspaceId, input.workspaceId));
  }),

  inviteMember: sessionProcedure
    .input(inputSchemas.workspace.inviteMember.extend({ workspaceId: z.string() }))
    .query(async ({ input, ctx }) => {
      await assertWorkspacePermission({
        workspaceId: input.workspaceId,
        userId: ctx.session.userId,
        role: WorkspaceMemberRole.ADMIN,
      });

      const invitedUser = await db
        .select({ id: Users.id })
        .from(Users)
        .where(and(eq(Users.email, input.email), eq(Users.state, UserState.ACTIVE)))
        .then(first);

      const workspace = await db
        .select({ name: Workspaces.name })
        .from(Workspaces)
        .where(eq(Workspaces.id, input.workspaceId))
        .then(firstOrThrow);

      if (invitedUser) {
        await db.insert(WorkspaceMembers).values({
          workspaceId: input.workspaceId,
          userId: invitedUser.id,
          role: WorkspaceMemberRole.MEMBER,
        });

        await sendEmail({
          recipient: input.email,
          subject: `[Readable] ${workspace.name}에 추가되었어요`,
          body: WorkspaceMemberAddedEmail({
            dashboardUrl: env.DASHBOARD_URL,
            workspaceId: input.workspaceId,
            workspaceName: workspace.name,
          }),
        });
      } else {
        await db.insert(WorkspaceMemberInvitations).values({
          workspaceId: input.workspaceId,
          email: input.email,
          expiresAt: dayjs().add(1, 'day'),
        });

        await sendEmail({
          recipient: input.email,
          subject: `[Readable] ${workspace.name}에 참여하세요`,
          body: WorkspaceMemberInvitedEmail({
            dashboardUrl: env.DASHBOARD_URL,
            workspaceName: workspace.name,
          }),
        });
      }
    }),

  removeMember: sessionProcedure
    .input(z.object({ workspaceId: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await assertWorkspacePermission({
        workspaceId: input.workspaceId,
        userId: ctx.session.userId,
        role: WorkspaceMemberRole.ADMIN,
      });

      if (input.userId === ctx.session.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '자기 자신을 워크스페이스에서 제거할 수 없어요',
        });
      }

      await db
        .delete(WorkspaceMembers)
        .where(and(eq(WorkspaceMembers.workspaceId, input.workspaceId), eq(WorkspaceMembers.userId, input.userId)));
    }),

  updateMemberRole: sessionProcedure
    .input(z.object({ workspaceId: z.string(), userId: z.string(), role: z.nativeEnum(WorkspaceMemberRole) }))
    .mutation(async ({ input, ctx }) => {
      await assertWorkspacePermission({
        workspaceId: input.workspaceId,
        userId: ctx.session.userId,
        role: WorkspaceMemberRole.ADMIN,
      });

      await db.transaction(async (tx) => {
        await tx
          .update(WorkspaceMembers)
          .set({ role: input.role })
          .where(and(eq(WorkspaceMembers.workspaceId, input.workspaceId), eq(WorkspaceMembers.userId, input.userId)));

        const adminCount = await tx
          .select({ count: count(WorkspaceMembers.id) })
          .from(WorkspaceMembers)
          .where(
            and(
              eq(WorkspaceMembers.workspaceId, input.workspaceId),
              eq(WorkspaceMembers.role, WorkspaceMemberRole.ADMIN),
            ),
          )
          .then(first);

        if (adminCount?.count === 0) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: '워크스페이스에는 최소 1명의 관리자가 있어야 해요',
          });
        }
      });
    }),
});