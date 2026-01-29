import { safeParseResponse } from '@/shared/neverthrow/fetch';

import { mcpError, mcpErrorFetch, mcpSuccessResponse } from './response';

import { requestSchema, buildRequest } from './lib/request';

import { tokenStringToNumber } from '@/shared/token';
import {
  safeGetPaymentSettlement,
  safeWrapFetchWithPayment,
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
      const fetchWithPay = safeWrapFetchWithPayment({
        account,
        server,
        surface: toolName,
        flags,
      });

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

      const settlementResult = safeGetPaymentSettlement(toolName, response);

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
