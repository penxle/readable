import dayjs from 'dayjs';
import { and, eq, gt } from 'drizzle-orm';
import ky from 'ky';
import { nanoid } from 'nanoid';
import { match } from 'ts-pattern';
import { builder } from '@/builder';
import { redis } from '@/cache';
import {
  db,
  first,
  firstOrThrow,
  Images,
  TeamMemberInvitations,
  TeamMembers,
  Users,
  UserSessions,
  UserSingleSignOns,
} from '@/db';
import { sendEmail } from '@/email';
import AuthorizationEmail from '@/email/templates/Authorization.tsx';
import { SingleSignOnProvider, TeamMemberRole, UserState } from '@/enums';
import { env } from '@/env';
import { ReadableError } from '@/errors';
import * as google from '@/external/google';
import { createAccessToken } from '@/utils/access-token';
import { generateRandomAvatar } from '@/utils/image-generation';
import { getTeamPlanRule } from '@/utils/plan';
import { persistBlobAsImage } from '@/utils/user-contents';
import { User } from './objects';
import type { Transaction } from '@/db';

/**
 * * Types
 */

const UserWithAccessToken = builder.simpleObject('UserWithAccessToken', {
  fields: (t) => ({
    user: t.field({ type: User }),
    accessToken: t.string(),
    isNewUser: t.boolean(),
  }),
});

/**
 * * Mutations
 */

builder.mutationFields((t) => ({
  sendAuthorizationEmail: t.fieldWithInput({
    type: 'Boolean',
    input: { email: t.input.string() },
    resolve: async (_, { input }) => {
      const code = nanoid();

      await redis.setex(`auth:email:${code}`, 60 * 10, input.email);

      await sendEmail({
        recipient: input.email,
        subject: '[Readable] 이메일을 인증해주세요',
        body: AuthorizationEmail({
          dashboardUrl: env.PUBLIC_DASHBOARD_URL,
          websiteUrl: env.PUBLIC_WEBSITE_URL,
          code,
        }),
      });

      return true;
    },
  }),

  generateSingleSignOnAuthorizationUrl: t.fieldWithInput({
    type: 'String',
    input: {
      provider: t.input.field({ type: SingleSignOnProvider }),
      email: t.input.field({ type: 'String', required: false }),
    },
    resolve: async (_, { input }) => {
      return match(input.provider)
        .with(SingleSignOnProvider.GOOGLE, () => google.generateAuthorizationUrl(input.email ?? undefined))
        .exhaustive();
    },
  }),

  authorizeEmail: t.fieldWithInput({
    type: UserWithAccessToken,
    input: { code: t.input.string() },
    resolve: async (_, { input }) => {
      const email = await redis.get(`auth:email:${input.code}`);

      if (!email) {
        throw new ReadableError({ code: 'invalid_code' });
      }

      const user = await db.select().from(Users).where(eq(Users.email, email.toLowerCase())).then(first);
      if (user) {
        return {
          user: user.id,
          accessToken: await createSessionAndReturnAccessToken(user.id),
          isNewUser: false,
        };
      }

      const avatar = await persistBlobAsImage({
        file: await generateRandomAvatar(),
      });

      const newUser = await db.transaction(async (tx) => {
        return await createUser(tx, {
          email,
          name: email.split('@')[0],
          avatarId: avatar.id,
        });
      });

      return {
        user: newUser.id,
        accessToken: await createSessionAndReturnAccessToken(newUser.id),
        isNewUser: true,
      };
    },
  }),

  authorizeSingleSignOn: t.fieldWithInput({
    type: UserWithAccessToken,
    input: { provider: t.input.field({ type: SingleSignOnProvider }), params: t.input.field({ type: 'JSON' }) },
    resolve: async (_, { input }) => {
      const externalUser = await match(input.provider)
        .with(SingleSignOnProvider.GOOGLE, () => google.authorizeUser(input.params.code))
        .exhaustive();

      const sso = await db
        .select({ userId: UserSingleSignOns.userId })
        .from(UserSingleSignOns)
        .where(
          and(
            eq(UserSingleSignOns.provider, externalUser.provider),
            eq(UserSingleSignOns.principal, externalUser.principal),
          ),
        )
        .then(first);

      if (sso) {
        return {
          user: sso.userId,
          accessToken: await createSessionAndReturnAccessToken(sso.userId),
          isNewUser: false,
        };
      }

      const existingUser = await db
        .select({ id: Users.id })
        .from(Users)
        .where(and(eq(Users.email, externalUser.email), eq(Users.state, UserState.ACTIVE)))
        .then(first);

      if (existingUser) {
        throw new ReadableError({ code: 'user_email_exists' });
      }

      const user = await db.transaction(async (tx) => {
        const avatarBlob = await ky(externalUser.avatarUrl).then((res) => res.blob());
        const avatar = await persistBlobAsImage({ file: new File([avatarBlob], externalUser.avatarUrl) });

        const user = await createUser(tx, {
          email: externalUser.email,
          name: externalUser.name,
          avatarId: avatar.id,
        });

        await tx.insert(UserSingleSignOns).values({
          userId: user.id,
          provider: externalUser.provider,
          principal: externalUser.principal,
          email: externalUser.email,
        });

        return user;
      });

      return {
        user: user.id,
        accessToken: await createSessionAndReturnAccessToken(user.id),
        isNewUser: true,
      };
    },
  }),

  logout: t.withAuth({ session: true }).field({
    type: 'Boolean',
    resolve: async (_, __, ctx) => {
      await db.delete(UserSessions).where(eq(UserSessions.id, ctx.session.id));

      return true;
    },
  }),
}));

/*
 * * Utils
 */

const createSessionAndReturnAccessToken = async (userId: string) => {
  const session = await db
    .insert(UserSessions)
    .values({ userId })
    .returning({ id: UserSessions.id })
    .then(firstOrThrow);

  return await createAccessToken(session.id);
};

type CreateUserParams = { email: string; name: string; avatarId: string };
const createUser = async (tx: Transaction, { email, name, avatarId }: CreateUserParams) => {
  const user = await tx.insert(Users).values({ email, name, avatarId }).returning({ id: Users.id }).then(firstOrThrow);

  await tx.update(Images).set({ userId: user.id }).where(eq(Images.id, avatarId));

  const invitations = await tx
    .delete(TeamMemberInvitations)
    .where(and(eq(TeamMemberInvitations.email, email), gt(TeamMemberInvitations.expiresAt, dayjs())))
    .returning({ teamId: TeamMemberInvitations.teamId });

  const teamIds = new Set(invitations.map((invitation) => invitation.teamId));

  for (const teamId of teamIds) {
    const memberRole = await getTeamPlanRule({
      teamId,
      rule: 'memberRole',
    });

    await tx.insert(TeamMembers).values({
      teamId,
      userId: user.id,
      role: memberRole ? TeamMemberRole.MEMBER : TeamMemberRole.ADMIN,
    });
  }

  return user;
};
