import {
  fetchErr,
  fetchOk,
  safeFetch,
  safeParseResponse,
} from '@/shared/neverthrow/fetch';

import { x402Client, x402HTTPClient } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm/exact/client';

import { mcpError, mcpErrorFetch, mcpSuccessResponse } from './response';

import { requestSchema, buildRequest } from './lib/request';
import { checkBalance } from './lib/check-balance';

import { DEFAULT_NETWORK } from '@/shared/networks';
import { tokenStringToNumber } from '@/shared/token';
import {
  safeCreatePaymentPayload,
  safeGetPaymentRequired,
  safeGetPaymentSettlement,
  x402Err,
  x402Ok,
} from '@/shared/neverthrow/x402';

import type { RegisterTools } from '@/server/types';

const toolName = 'fetch';

export const registerFetchX402ResourceTool: RegisterTools = ({
  server,
  account,
  flags,
  sessionId,
}) => {
  server.registerTool(
    toolName,
    {
      title: 'Fetch',
      description:
        'Makes an http fetch request. If the request is to an x402-protected resource, it will handle payment automatically.',
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
          surface: toolName,
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

      const fetchResult = await fetchWithPay(
        buildRequest({ input, address: account.address, sessionId })
      );

      if (fetchResult.isErr()) {
        return mcpError(fetchResult);
      }

      const { response, paymentPayload } = fetchResult.value;

      if (!response.ok) {
        return mcpErrorFetch(toolName, response);
      }

      const parseResponseResult = await safeParseResponse(toolName, response);

      if (parseResponseResult.isErr()) {
        return mcpError(parseResponseResult);
      }

      const settlementResult = safeGetPaymentSettlement(
        toolName,
        client,
        response
      );

      return mcpSuccessResponse(
        parseResponseResult.value,

        settlementResult.isOk() || paymentPayload !== undefined
          ? {
              ...(paymentPayload !== undefined
                ? {
                    price: tokenStringToNumber(
                      paymentPayload.accepted.amount
                    ).toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }),
                  }
                : {}),
              ...(settlementResult.isOk()
                ? {
                    payment: {
                      success: settlementResult.value.success,
                      transactionHash: settlementResult.value.transaction,
                    },
                  }
                : {}),
            }
          : undefined
      );
    }
  );
};

function safeWrapFetchWithPayment(client: x402HTTPClient) {
  return async (request: Request) => {
    const clonedRequest = request.clone();

    const probeResult = await safeFetch(toolName, request);

    if (probeResult.isErr()) {
      return fetchErr(toolName, probeResult.error);
    }

    if (probeResult.value.status !== 402) {
      return probeResult.andThen(response =>
        fetchOk({
          response,
          paymentPayload: undefined,
        })
      );
    }

    const response = probeResult.value;

    const paymentRequiredResult = await safeGetPaymentRequired(
      toolName,
      client,
      response
    );

    if (paymentRequiredResult.isErr()) {
      return paymentRequiredResult;
    }

    const paymentRequired = paymentRequiredResult.value;

    const paymentPayloadResult = await safeCreatePaymentPayload(
      toolName,
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
      return x402Err(toolName, {
        cause: 'payment_already_attempted',
        message: 'Payment already attempted',
      });
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
    return await safeFetch(toolName, clonedRequest).andThen(response =>
      x402Ok({
        response,
        paymentPayload,
      })
    );
  };
}
