import { PaymentRequirementsSchema } from 'x402/types';
import type { PaymentRequirementsSelector } from 'x402/client';
import { selectPaymentRequirements } from 'x402/client';
import type { TransactionModifyingSigner } from '@solana/kit';
import { createPaymentHeader } from './create-payment-header';

export function wrapFetchWithSolanaPayment(
  fetch: typeof globalThis.fetch,
  signer: TransactionModifyingSigner,
  maxValue = BigInt(0.1 * 10 ** 6), // Default to 0.10 USDC
  paymentRequirementsSelector: PaymentRequirementsSelector = selectPaymentRequirements
) {
  return async (input: RequestInfo, init?: RequestInit) => {
    const response = await fetch(input, init);

    if (response.status !== 402) {
      return response;
    }

    const { x402Version, accepts } = (await response.json()) as {
      x402Version: number;
      accepts: unknown[];
    };
    const parsedPaymentRequirements = accepts.map(x =>
      PaymentRequirementsSchema.parse(x)
    );

    const selectedPaymentRequirements = paymentRequirementsSelector(
      parsedPaymentRequirements,
      'solana',
      'exact'
    );

    if (BigInt(selectedPaymentRequirements.maxAmountRequired) > maxValue) {
      throw new Error('Payment amount exceeds maximum allowed');
    }

    console.log(selectedPaymentRequirements);

    const paymentHeader = await createPaymentHeader(
      signer,
      x402Version,
      selectedPaymentRequirements
    );

    console.log(paymentHeader);

    if (!init) {
      throw new Error('Missing fetch request configuration');
    }

    if ((init as { __is402Retry?: boolean }).__is402Retry) {
      throw new Error('Payment already attempted');
    }

    const newInit = {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        'X-PAYMENT': paymentHeader,
        'Access-Control-Expose-Headers': 'X-PAYMENT-RESPONSE',
      },
      __is402Retry: true,
    };

    const secondResponse = await fetch(input, newInit);
    return secondResponse;
  };
}
