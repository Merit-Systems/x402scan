import { safeParseResponse } from '@/shared/neverthrow/fetch';

import { x402Client, x402HTTPClient } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm/exact/client';

import { mcpError, mcpErrorFetch, mcpSuccessResponse } from './response';

import { requestSchema, buildRequest } from './lib/request';
import { checkBalance } from './lib/check-balance';

import { DEFAULT_NETWORK } from '@/shared/networks';
import { tokenStringToNumber } from '@/shared/token';
import { safeGetPaymentSettlement } from '@/shared/neverthrow/x402';
import { createFetchWithPayment } from '@/shared/operations';

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
      description: `HTTP fetch with automatic x402 payment. Detects 402 responses, signs payment, retries with payment headers. Returns response data + payment details (price, tx hash) if paid. Check balance with get_wallet_info first.`,
      inputSchema: requestSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
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

      const fetchWithPay = createFetchWithPayment(toolName, client);

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
