import { Errors, PortOneClient } from '@portone/server-sdk';
import { match, P } from 'ts-pattern';
import { env } from '@/env';

export const client = PortOneClient(env.PORTONE_API_KEY);

type PortOneSuccessResult<T> = { status: 'succeeded' } & T;
type PortOneFailureResult = { status: 'failed'; code: string; message: string };

type PortOneResult<T> = PortOneSuccessResult<T> | PortOneFailureResult;

type IssueBillingKeyParams = {
  customerId: string;
  cardNumber: string;
  expiryYear: string;
  expiryMonth: string;
  birthOrBusinessRegistrationNumber: string;
  passwordTwoDigits: string;
};
type IssueBillingKeyResult = PortOneResult<{
  billingKey: string;
  card: {
    name: string;
  };
}>;
export const issueBillingKey = async (params: IssueBillingKeyParams): Promise<IssueBillingKeyResult> => {
  try {
    const {
      billingKeyInfo: { billingKey },
    } = await client.payment.billingKey.issueBillingKey({
      channelKey: env.PORTONE_CHANNEL_KEY,
      method: {
        card: {
          credential: {
            number: params.cardNumber,
            expiryYear: params.expiryYear,
            expiryMonth: params.expiryMonth,
            birthOrBusinessRegistrationNumber: params.birthOrBusinessRegistrationNumber,
            passwordTwoDigits: params.passwordTwoDigits,
          },
        },
      },
      customer: {
        id: params.customerId,
      },
    });

    const resp = await client.payment.billingKey.getBillingKeyInfo(billingKey);

    if (!resp || resp.status !== 'ISSUED' || resp.methods?.[0].type !== 'BillingKeyPaymentMethodCard') {
      throw new Error('Failed to issue billing key');
    }

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const card = resp.methods[0].card!;

    return makeSuccessResult({
      billingKey,
      card: {
        name: card.name!,
      },
    });
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  } catch (err) {
    return makeFailureResult(err);
  }
};

type DeleteBillingKeyParams = {
  billingKey: string;
};
type DeleteBillingKeyResult = PortOneResult<unknown>;
export const deleteBillingKey = async (params: DeleteBillingKeyParams): Promise<DeleteBillingKeyResult> => {
  try {
    await client.payment.billingKey.deleteBillingKey(params.billingKey);

    return makeSuccessResult({});
  } catch (err) {
    return makeFailureResult(err);
  }
};

type MakePaymentParams = {
  paymentId: string;
  billingKey: string;
  customerName: string;
  customerEmail: string;
  orderName: string;
  amount: number;
};
type MakePaymentResult = PortOneResult<{ approvalNumber: string; receiptUrl: string }>;
export const makePayment = async (params: MakePaymentParams): Promise<MakePaymentResult> => {
  try {
    await client.payment.payWithBillingKey({
      paymentId: params.paymentId,
      billingKey: params.billingKey,
      orderName: params.orderName,
      amount: { total: params.amount },
      currency: 'KRW',
      customer: {
        name: { full: params.customerName },
        email: params.customerEmail,
      },
    });

    const resp = await client.payment.getPayment(params.paymentId);

    if (!resp || resp.status !== 'PAID' || resp.method?.type !== 'PaymentMethodCard') {
      throw new Error('Failed to make payment');
    }

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    return makeSuccessResult({
      approvalNumber: resp.method.approvalNumber!,
      receiptUrl: resp.receiptUrl!,
    });
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  } catch (err) {
    return makeFailureResult(err);
  }
};

type CancelPaymentParams = {
  paymentId: string;
  reason: string;
  amount: number;
};
type CancelPaymentResult = PortOneResult<{ receiptUrl: string }>;
export const cancelPayment = async (params: CancelPaymentParams): Promise<CancelPaymentResult> => {
  try {
    const resp = await client.payment.cancelPayment({
      paymentId: params.paymentId,
      reason: params.reason,
      amount: params.amount,
    });

    if (resp.cancellation.status !== 'SUCCEEDED') {
      throw new Error('Failed to refund payment');
    }

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    return makeSuccessResult({
      receiptUrl: resp.cancellation.receiptUrl!,
    });
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  } catch (err) {
    return makeFailureResult(err);
  }
};

const makeSuccessResult = <T>(data: T): PortOneSuccessResult<T> => {
  return { status: 'succeeded', ...data };
};

const makeFailureResult = (error: unknown): PortOneFailureResult => {
  return {
    status: 'failed',
    ...match(error)
      .with(P.instanceOf(Errors.PgProviderError), (e) => ({ code: e.pgCode, message: e.pgMessage }))
      .with(P.instanceOf(Errors.PortOneError), (e) => ({ code: e.name, message: e.message }))
      .with(P.instanceOf(Error), (e) => ({ code: e.message, message: e.message }))
      .otherwise((e) => ({ code: 'unknown', message: String(e) })),
  };
};
