import { mcpX402FetchResponse } from './response';

import { requestSchema, buildRequest } from './lib/request';

import { safeWrapFetchWithPayment } from '@/shared/neverthrow/x402';

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

      return mcpX402FetchResponse({
        surface: toolName,
        x402FetchResult: fetchResult,
      });
    }
  );
};
