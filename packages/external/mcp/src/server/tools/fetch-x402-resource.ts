import { x402Client, x402HTTPClient } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { wrapFetchWithPayment } from '@x402/fetch';

import { mcpError, mcpSuccess } from '@/server/lib/response';
import { requestWithHeadersSchema } from '@/server/lib/schemas';
import { FetchStates } from '@/server/types';

import { log } from '@/lib/log';
import { DEFAULT_NETWORK } from '@/lib/networks';
import { tokenStringToNumber } from '@/lib/token';

import { checkBalance } from '../lib/check-balance';

import type { RegisterTools } from '@/server/types';
import { parseResponse } from '../lib/parse-response';

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
      inputSchema: requestWithHeadersSchema,
    },
    async ({ url, method, body, headers }) => {
      const coreClient = x402Client.fromConfig({
        schemes: [
          { network: DEFAULT_NETWORK, client: new ExactEvmScheme(account) },
        ],
      });

      let state: FetchStates = FetchStates.INITIAL_REQUEST;

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
        state = FetchStates.PAYMENT_REQUIRED;
      });

      coreClient.onAfterPaymentCreation(async ctx => {
        state = FetchStates.PAYMENT_CREATED;
        log.info('After payment creation', ctx);
        return Promise.resolve();
      });

      coreClient.onPaymentCreationFailure(async ctx => {
        state = FetchStates.PAYMENT_FAILED;
        log.info('Payment creation failure', ctx);
        return Promise.resolve();
      });
      const client = new x402HTTPClient(coreClient);

      const fetchWithPay = wrapFetchWithPayment(fetch, client);

      try {
        const response = await fetchWithPay(url, {
          method,
          body:
            typeof body === 'string'
              ? body
              : body
                ? JSON.stringify(body)
                : undefined,
          headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            'X-Wallet-Address': account.address,
            'X-Client-ID': account.address,
            ...headers,
          },
        });

        if (!response.ok) {
          const errorResponse = {
            data: await parseResponse(response),
            statusCode: response.status,
            state,
          };
          if (response.status === 402) {
            return mcpError('Payment required', errorResponse);
          }
          return mcpError(
            response.statusText ?? 'Request failed',
            errorResponse
          );
        }

        const getSettlement = () => {
          try {
            return client.getPaymentSettleResponse(name =>
              response.headers.get(name)
            );
          } catch {
            return undefined;
          }
        };

        const settlement = getSettlement();

        return mcpSuccess({
          data: await parseResponse(response),
          payment: settlement,
        });
      } catch (err) {
        return mcpError(err, { state });
      }
    }
  );
};
