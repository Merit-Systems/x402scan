import { parseUnits } from 'viem';
import { createPaymentHeader, selectPaymentRequirements } from 'x402/client';
import { PaymentRequirementsSchema } from 'x402/types';
import type { Signer } from 'x402/types';

async function getPaymentHeaderFromBody(
  body: unknown,
  walletClient: Signer,
  maxAmount?: number
) {
  const { x402Version, accepts } = body as {
    x402Version: number;
    accepts: unknown[];
  };
  const parsedPaymentRequirements = accepts.map(x =>
    PaymentRequirementsSchema.parse(x)
  );

  const selectedPaymentRequirements = selectPaymentRequirements(
    parsedPaymentRequirements
  );

  if (maxAmount) {
    if (
      BigInt(selectedPaymentRequirements.maxAmountRequired) >
      BigInt(parseUnits(String(maxAmount), 6))
    ) {
      throw new Error('Max amount exceeded');
    }
  }

  const paymentHeader = await createPaymentHeader(
    walletClient,
    x402Version,
    selectedPaymentRequirements
  );
  return paymentHeader;
}

export function fetchWithX402Payment(
  fetch: typeof globalThis.fetch,
  walletClient: Signer,
  maxAmount?: number
): typeof fetch {
  return async (input: string | URL | Request, init?: RequestInit) => {
    const headers: Record<string, string> = {
      ...((init?.headers as Record<string, string>) || {}),
    };

    const response = await fetch(input, {
      ...init,
      headers,
    });

    if (response.status === 402) {
      const paymentRequiredJson = (await response.json()) as unknown;
      const paymentHeader = await getPaymentHeaderFromBody(
        paymentRequiredJson,
        walletClient,
        maxAmount
      );
      headers['x-payment'] = paymentHeader;
      const newResponse = await fetch(input, {
        ...init,
        headers,
      });
      return newResponse;
    }

    return response;
  };
}
