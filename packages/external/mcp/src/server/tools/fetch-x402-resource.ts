import { safeFetch, safeParseResponse } from '@x402scan/neverthrow/fetch';

import { x402Client, x402HTTPClient } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm/exact/client';

import { DEFAULT_NETWORK } from '@/shared/networks';
import { tokenStringToNumber } from '@/shared/token';

import { mcpError, mcpSuccess } from '@/server/lib/response';
import { requestSchema } from '@/server/lib/schemas';

import { checkBalance } from '../lib/check-balance';
import {
  safeCreatePaymentPayload,
  safeGetPaymentRequired,
  safeGetPaymentSettlement,
} from '../lib/x402/result';

import type { RegisterTools } from '@/server/types';
import { buildRequest } from '../lib/build-request';

const surface = 'fetch-x402-resource';

export const registerFetchX402ResourceTool: RegisterTools = ({
  server,
  account,
  flags,
}) => {
  server.registerTool(
    'fetch',
    {
      description:
        'Fetches an x402-protected resource and handles payment automatically. If the resource is not x402-protected, it will return the raw response.',
      inputSchema: requestSchema,
    },
    async input => {
      const coreClient = x402Client.fromConfig({
        schemes: [
          { network: DEFAULT_NETWORK, client: new ExactEvmScheme(account) },
        ],
      });

      coreClient.onBeforePaymentCreation(async ({ selectedRequirements }) => {
        const amount = tokenStringToNumber(selectedRequirements.amount);
        await checkBalance({
          server,
          address: account.address,
          amountNeeded: amount,
          message: balance =>
            `This request costs ${amount} USDC. Your current balance is ${balance} USDC.`,
          flags,
        });
      });

      const client = new x402HTTPClient(coreClient);

      const fetchWithPay = safeWrapFetchWithPayment(client);

      const fetchResult = await fetchWithPay(buildRequest(input));

      if (fetchResult.isErr()) {
        return mcpError(fetchResult.error);
      }

      const response = fetchResult.value;

      const parseResponseResult = await safeParseResponse(surface, response);

      if (parseResponseResult.isErr()) {
        return mcpError({
          ...parseResponseResult.error,
          ...(response.status === 402
            ? {
                extra:
                  'You do not have enough balance to pay for this request.',
              }
            : {}),
        });
      }

      if (!response.ok) {
        return mcpError({
          statusCode: response.status,
          contentType: response.headers.get('content-type') ?? 'Not specified',
          body: ['json', 'text'].includes(parseResponseResult.value.type)
            ? parseResponseResult.value.data
            : undefined,
          ...(response.status === 402
            ? {
                extra:
                  'You do not have enough balance to pay for this request.',
              }
            : {}),
        });
      }

      const settlementResult = await safeGetPaymentSettlement(
        surface,
        client,
        response
      );

      return mcpSuccess({
        data: parseResponseResult.value.data,
        ...(settlementResult.isOk() ? { payment: settlementResult.value } : {}),
      });
    }
  );
};

function safeWrapFetchWithPayment(client: x402HTTPClient) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    const clonedRequest = request.clone();

    const probeResult = await safeFetch(surface, request);

    if (probeResult.isErr()) {
      return probeResult;
    }

    if (probeResult.value.status !== 402) {
      return probeResult;
    }

    const response = probeResult.value;

    const paymentRequiredResult = await safeGetPaymentRequired(
      surface,
      client,
      response
    );

    if (paymentRequiredResult.isErr()) {
      return paymentRequiredResult;
    }

    const paymentRequired = paymentRequiredResult.value;

    const paymentPayloadResult = await safeCreatePaymentPayload(
      surface,
      client,
      paymentRequired
    );

    if (paymentPayloadResult.isErr()) {
      return paymentPayloadResult;
    }

    const paymentPayload = paymentPayloadResult.value;

    // Encode payment header
    const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);

    // Check if this is already a retry to prevent infinite loops
    if (
      clonedRequest.headers.has('PAYMENT-SIGNATURE') ||
      clonedRequest.headers.has('X-PAYMENT')
    ) {
      throw new Error('Payment already attempted');
    }

    // Add payment headers to cloned request
    for (const [key, value] of Object.entries(paymentHeaders)) {
      clonedRequest.headers.set(key, value);
    }
    clonedRequest.headers.set(
      'Access-Control-Expose-Headers',
      'PAYMENT-RESPONSE,X-PAYMENT-RESPONSE'
    );

    // Retry the request with payment
    return await safeFetch(surface, clonedRequest);
  };
}
