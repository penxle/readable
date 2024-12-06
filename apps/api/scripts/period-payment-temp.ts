import '@readable/lib/dayjs';

import { confirm } from '@inquirer/prompts';
import { and, eq, gt, max } from 'drizzle-orm';
import {
  db,
  firstOrThrow,
  PaymentInvoiceItems,
  PaymentInvoices,
  PaymentMethods,
  PaymentRecords,
  Plans,
  TeamPlans,
  Teams,
} from '@/db';
import { PaymentInvoiceItemType, PaymentInvoiceState, PaymentRecordType } from '@/enums';
import * as portone from '@/external/portone';
import { calculatePaymentAmount } from '@/utils/payment';

const paidTeams = await db
  .select({
    id: Teams.id,
    name: Teams.name,
    paymentMethodId: PaymentMethods.id,
    billingCycle: TeamPlans.billingCycle,
    lastPaymentAt: max(PaymentInvoices.createdAt),
  })
  .from(Teams)
  .innerJoin(TeamPlans, eq(TeamPlans.teamId, Teams.id))
  .innerJoin(Plans, and(eq(TeamPlans.planId, Plans.id), gt(Plans.fee, 0)))
  .innerJoin(PaymentMethods, eq(Teams.id, PaymentMethods.teamId))
  .leftJoin(PaymentInvoices, eq(PaymentInvoices.teamId, Teams.id))
  .where(gt(Plans.fee, 0))
  .groupBy(Teams.id, TeamPlans.id, PaymentMethods.id);

for (const team of paidTeams) {
  console.log(`${team.name} - 마지막 결제 ${team.lastPaymentAt?.format('YYYY-MM-DD')} (${team.billingCycle})`);

  if (await confirm({ message: '결제 필요한가요?', default: false })) {
    const plan = await db
      .select({
        name: Plans.name,
        fee: Plans.fee,
        billingKey: PaymentMethods.billingKey,
        billingEmail: TeamPlans.billingEmail,
      })
      .from(TeamPlans)
      .innerJoin(Plans, eq(TeamPlans.planId, Plans.id))
      .innerJoin(PaymentMethods, eq(TeamPlans.teamId, PaymentMethods.teamId))
      .where(eq(TeamPlans.teamId, team.id))
      .then(firstOrThrow);

    const paymentAmount = calculatePaymentAmount({ fee: plan.fee, billingCycle: team.billingCycle });
    console.log(`월 결제 금액 ${paymentAmount}원`);

    if (await confirm({ message: '결제 진행하겠습니까?', default: false })) {
      await db.transaction(async (tx) => {
        const invoice = await tx
          .insert(PaymentInvoices)
          .values({
            teamId: team.id,
            amount: paymentAmount,
            state: PaymentInvoiceState.COMPLETED,
          })
          .returning({ id: PaymentInvoices.id })
          .then(firstOrThrow);

        await tx.insert(PaymentInvoiceItems).values({
          invoiceId: invoice.id,
          name: plan.name,
          quantity: 1,
          amount: paymentAmount,
          type: PaymentInvoiceItemType.PLAN,
          order: 0,
        });

        const res = await portone.makePayment({
          paymentId: invoice.id,
          billingKey: plan.billingKey,
          customerName: team.name,
          customerEmail: plan.billingEmail,
          orderName: '리더블 정기결제',
          amount: paymentAmount,
        });

        if (res.status === 'failed') {
          console.error(`결제 실패: ${res.message}`);
          throw tx.rollback();
        }

        await tx.insert(PaymentRecords).values({
          invoiceId: invoice.id,
          methodId: team.paymentMethodId,
          type: PaymentRecordType.SUCCESS,
          amount: paymentAmount,
          receiptUrl: res.receiptUrl,
        });
      });
    }
  }
}

process.exit(0);
