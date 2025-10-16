import { createPaymentHeader, selectPaymentRequirements } from 'x402/client';
import { PaymentRequirementsSchema } from 'x402/types';
import type { Signer } from 'x402/types';

async function getPaymentHeaderFromBody(body: unknown, walletClient: Signer) {
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

  const paymentHeader = await createPaymentHeader(
    walletClient,
    x402Version,
    selectedPaymentRequirements
  );
  return paymentHeader;
}

export function fetchWithX402Payment(
  fetch: typeof globalThis.fetch,
  walletClient: Signer
): typeof fetch {
  return async (input: string | URL | Request, init?: RequestInit) => {
    const headers: Record<string, string> = {
      ...((init?.headers as Record<string, string>) || {}),
    };

    delete headers.Authorization;
    delete headers.authorization;

    const response = await fetch(input, {
      ...init,
      headers,
    });

    if (response.status === 402) {
      const paymentRequiredJson = (await response.json()) as unknown;
      const paymentHeader = await getPaymentHeaderFromBody(
        paymentRequiredJson,
        walletClient
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
