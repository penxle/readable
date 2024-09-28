import dayjs from 'dayjs';
import { and, desc, eq } from 'drizzle-orm';
import { match } from 'ts-pattern';
import { builder } from '@/builder';
import {
  Addons,
  db,
  first,
  firstOrThrow,
  PaymentInvoices,
  PaymentMethods,
  PaymentRecords,
  Plans,
  SiteAddons,
  Sites,
  TeamPlans,
  Teams,
} from '@/db';
import {
  BillingCycle,
  PaymentInvoiceState,
  PaymentMethodState,
  PaymentRecordType,
  PlanType,
  TeamMemberRole,
  TeamRestrictionType,
} from '@/enums';
import { ReadableError } from '@/errors';
import * as portone from '@/external/portone';
import { dataSchemas } from '@/schemas';
import { assertSitePermission, assertTeamPermission } from '@/utils/permissions';
import { assertTeamRestriction } from '@/utils/restrictions';
import { PaymentInvoice, PaymentMethod, PaymentRecord, Site, Team } from './objects';

PaymentInvoice.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    amount: t.exposeInt('amount'),
    state: t.expose('state', { type: PaymentInvoiceState }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),

    records: t.field({
      type: [PaymentRecord],
      resolve: async (invoice) => {
        return await db
          .select()
          .from(PaymentRecords)
          .where(eq(PaymentRecords.invoiceId, invoice.id))
          .orderBy(desc(PaymentRecords.createdAt));
      },
    }),
  }),
});

PaymentMethod.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
  }),
});

PaymentRecord.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    type: t.expose('type', { type: PaymentRecordType }),
    amount: t.exposeInt('amount'),
    receiptUrl: t.exposeString('receiptUrl', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),

    paymentMethod: t.field({
      type: PaymentMethod,
      resolve: (record) => record.methodId,
    }),
  }),
});

builder.mutationFields((t) => ({
  updatePaymentMethod: t.withAuth({ session: true }).fieldWithInput({
    type: PaymentMethod,
    input: {
      teamId: t.input.id(),
      cardNumber: t.input.string({ validate: { schema: dataSchemas.card.number } }),
      expiry: t.input.string({ validate: { schema: dataSchemas.card.expiry } }),
      birthOrBusinessRegistrationNumber: t.input.string({
        validate: { schema: dataSchemas.card.birthOrBusinessRegistrationNumber },
      }),
      passwordTwoDigits: t.input.string({ validate: { schema: dataSchemas.card.passwordTwoDigits } }),
    },
    resolve: async (_, { input }, ctx) => {
      await assertTeamPermission({
        teamId: input.teamId,
        userId: ctx.session.userId,
        role: TeamMemberRole.ADMIN,
      });

      const [, expiryMonth, expiryYear] = input.expiry.match(/^(\d{2})(\d{2})$/) || [];

      const result = await portone.issueBillingKey({
        customerId: input.teamId,
        cardNumber: input.cardNumber,
        expiryYear,
        expiryMonth,
        birthOrBusinessRegistrationNumber: input.birthOrBusinessRegistrationNumber,
        passwordTwoDigits: input.passwordTwoDigits,
      });

      if (result.status === 'failed') {
        throw new Error('Failed to issue billing key');
      }

      return await db.transaction(async (tx) => {
        const methods = await tx
          .update(PaymentMethods)
          .set({ state: PaymentMethodState.DEACTIVATED })
          .where(and(eq(PaymentMethods.teamId, input.teamId), eq(PaymentMethods.state, PaymentMethodState.ACTIVE)))
          .returning({ billingKey: PaymentMethods.billingKey });

        for (const method of methods) {
          await portone.deleteBillingKey({ billingKey: method.billingKey });
        }

        return await tx
          .insert(PaymentMethods)
          .values({
            teamId: input.teamId,
            name: `${result.card.name} ${input.cardNumber.slice(-4)}`,
            billingKey: result.billingKey,
          })
          .returning()
          .then(firstOrThrow);
      });
    },
  }),

  enrollTeamPlan: t.withAuth({ session: true }).fieldWithInput({
    type: Team,
    input: {
      teamId: t.input.id(),
      planId: t.input.id(),
      billingCycle: t.input.field({ type: BillingCycle }),
    },
    resolve: async (_, { input }, ctx) => {
      await assertTeamPermission({
        teamId: input.teamId,
        userId: ctx.session.userId,
        role: TeamMemberRole.ADMIN,
      });

      await assertTeamRestriction({
        teamId: input.teamId,
        type: TeamRestrictionType.DASHBOARD_WRITE,
      });

      const teamPlan = await db
        .select({ planId: TeamPlans.planId, billingEmail: TeamPlans.billingEmail })
        .from(TeamPlans)
        .where(eq(TeamPlans.teamId, input.teamId))
        .then(firstOrThrow);

      if (teamPlan.planId === input.planId) {
        throw new ReadableError({ code: 'already_enrolled' });
      }

      const paymentMethod = await db
        .select({ id: PaymentMethods.id, billingKey: PaymentMethods.billingKey })
        .from(PaymentMethods)
        .where(and(eq(PaymentMethods.teamId, input.teamId), eq(PaymentMethods.state, PaymentMethodState.ACTIVE)))
        .then(firstOrThrow);

      const plan = await db
        .select({ fee: Plans.fee })
        .from(Plans)
        .where(and(eq(Plans.id, input.planId), eq(Plans.type, PlanType.PUBLIC)))
        .then(firstOrThrow);

      const team = await db
        .select({ name: Teams.name })
        .from(Teams)
        .where(eq(Teams.id, input.teamId))
        .then(firstOrThrow);

      const paymentAmount = match(input.billingCycle)
        .with(BillingCycle.MONTHLY, () => plan.fee)
        .with(BillingCycle.YEARLY, () => plan.fee * 10)
        .exhaustive();

      await db.transaction(async (tx) => {
        const invoice = await tx
          .insert(PaymentInvoices)
          .values({
            teamId: input.teamId,
            amount: paymentAmount,
            state: PaymentInvoiceState.COMPLETED,
          })
          .returning({ id: PaymentInvoices.id })
          .then(firstOrThrow);

        const res = await portone.makePayment({
          paymentId: invoice.id,
          billingKey: paymentMethod.billingKey,
          customerName: team.name,
          customerEmail: teamPlan.billingEmail,
          orderName: '리더블 정기결제',
          amount: paymentAmount,
        });

        if (res.status === 'failed') {
          throw new ReadableError({ code: 'payment_failed', message: res.message });
        }

        await tx.insert(PaymentRecords).values({
          invoiceId: invoice.id,
          methodId: paymentMethod.id,
          type: PaymentRecordType.SUCCESS,
          amount: paymentAmount,
          receiptUrl: res.receiptUrl,
        });

        await tx
          .update(TeamPlans)
          .set({
            planId: input.planId,
            billingCycle: input.billingCycle,
            enrolledAt: dayjs(),
          })
          .where(eq(TeamPlans.teamId, input.teamId));
      });

      return input.teamId;
    },
  }),

  enrollSiteAddon: t.withAuth({ session: true }).fieldWithInput({
    type: Site,
    input: {
      siteId: t.input.id(),
      addonId: t.input.id(),
    },
    resolve: async (_, { input }, ctx) => {
      await assertSitePermission({
        siteId: input.siteId,
        userId: ctx.session.userId,
        role: TeamMemberRole.ADMIN,
      });

      await assertTeamRestriction({
        siteId: input.siteId,
        type: TeamRestrictionType.DASHBOARD_WRITE,
      });

      const addon = await db
        .select({ fee: Addons.fee })
        .from(Addons)
        .where(eq(Addons.id, input.addonId))
        .then(firstOrThrow);

      const siteAddon = await db
        .select({ id: SiteAddons.id })
        .from(SiteAddons)
        .where(and(eq(SiteAddons.siteId, input.siteId), eq(SiteAddons.addonId, input.addonId)))
        .then(first);

      if (siteAddon) {
        throw new ReadableError({ code: 'already_enrolled' });
      }

      const site = await db
        .select({ teamId: Sites.teamId })
        .from(Sites)
        .where(eq(Sites.id, input.siteId))
        .then(firstOrThrow);

      const teamPlan = await db
        .select({
          planId: TeamPlans.planId,
          billingCycle: TeamPlans.billingCycle,
          billingEmail: TeamPlans.billingEmail,
        })
        .from(TeamPlans)
        .where(eq(TeamPlans.teamId, site.teamId))
        .then(firstOrThrow);

      const plan = await db
        .select({ rules: Plans.rules })
        .from(Plans)
        .where(eq(Plans.id, teamPlan.planId))
        .then(firstOrThrow);

      if (!plan.rules.addonsAvailable?.includes(input.addonId)) {
        throw new ReadableError({ code: 'addon_not_available' });
      }

      const paymentMethod = await db
        .select({ id: PaymentMethods.id, billingKey: PaymentMethods.billingKey })
        .from(PaymentMethods)
        .where(and(eq(PaymentMethods.teamId, site.teamId), eq(PaymentMethods.state, PaymentMethodState.ACTIVE)))
        .then(firstOrThrow);

      const team = await db
        .select({ name: Teams.name })
        .from(Teams)
        .where(eq(Teams.id, site.teamId))
        .then(firstOrThrow);

      // TODO: 일할 계산 필요
      const paymentAmount = match(teamPlan.billingCycle)
        .with(BillingCycle.MONTHLY, () => addon.fee)
        .with(BillingCycle.YEARLY, () => addon.fee * 10)
        .exhaustive();

      await db.transaction(async (tx) => {
        const invoice = await tx
          .insert(PaymentInvoices)
          .values({
            teamId: site.teamId,
            amount: paymentAmount,
            state: PaymentInvoiceState.COMPLETED,
          })
          .returning({ id: PaymentInvoices.id })
          .then(firstOrThrow);

        const res = await portone.makePayment({
          paymentId: invoice.id,
          billingKey: paymentMethod.billingKey,
          customerName: team.name,
          customerEmail: teamPlan.billingEmail,
          orderName: '리더블 정기결제',
          amount: paymentAmount,
        });

        if (res.status === 'failed') {
          throw new ReadableError({ code: 'payment_failed', message: res.message });
        }

        await tx.insert(PaymentRecords).values({
          invoiceId: invoice.id,
          methodId: paymentMethod.id,
          type: PaymentRecordType.SUCCESS,
          amount: paymentAmount,
          receiptUrl: res.receiptUrl,
        });

        await tx.insert(SiteAddons).values({
          siteId: input.siteId,
          addonId: input.addonId,
        });
      });

      return input.siteId;
    },
  }),
}));
