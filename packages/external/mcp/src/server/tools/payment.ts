import { formatUnits } from 'viem';

import { x402Client, x402HTTPClient } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { wrapFetchWithPayment } from '@x402/fetch';

import { mcpSuccess, mcpError } from '@/server/lib/response';
import { requestSchema, requestWithHeadersSchema } from '@/server/lib/schemas';
import { FetchStates } from '@/server/types';

import { log } from '@/lib/log';

import { checkBalance } from '../lib/check-balance';

import type { RegisterTools } from '@/server/types';
import { DEFAULT_NETWORK } from '@/lib/networks';

export const registerPaymentTools: RegisterTools = ({
  server,
  account,
  flags,
}) => {
  server.registerTool(
    'query_endpoint',
    {
      description:
        'Probe an x402-protected endpoint to get pricing and requirements without payment. Returns payment options, Bazaar schema, and Sign-In-With-X auth requirements (x402 v2) if available.',
      inputSchema: requestSchema,
    },
    async ({ url, method, body }) => {
      const client = new x402HTTPClient(new x402Client());
      try {
        log.info('Querying endpoint', { url, method, body });
        const response = await fetch(url, {
          method,
          body: body ? JSON.stringify(body) : undefined,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const bodyText = await response.text().catch(() => undefined);

        if (response.status !== 402) {
          return mcpSuccess({
            isX402Endpoint: false,
            statusCode: response.status,
            message: 'This endpoint does not require payment',
            body,
          });
        }

        try {
          if (!bodyText) throw new Error('No body received from endpoint');

          const paymentRequired = client.getPaymentRequiredResponse(
            name => response.headers.get(name),
            JSON.parse(bodyText)
          );

          return mcpSuccess({
            isX402Endpoint: true,
            statusCode: response.status,
            paymentRequired,
            body: bodyText,
          });
        } catch (err) {
          return mcpError(err, { tool: 'query_endpoint', url });
        }
      } catch (err) {
        return mcpError(err, { tool: 'query_endpoint', url });
      }
    }
  );

  // execute_call - make paid request
  server.registerTool(
    'fetch',
    {
      description:
        'Make a paid request to any HTTP endpoint. If the resource is x402-protected, it will handle the 402 payment flow automatically.',
      inputSchema: requestWithHeadersSchema,
    },
    async ({ url, method, body, headers }) => {
      const coreClient = x402Client.fromConfig({
        schemes: [
          { network: DEFAULT_NETWORK, client: new ExactEvmScheme(account) },
        ],
      });

      let fetchState: FetchStates = FetchStates.INITIAL_REQUEST;

      coreClient.onBeforePaymentCreation(async ({ selectedRequirements }) => {
        const amount = parseFloat(
          formatUnits(BigInt(selectedRequirements.amount), 6)
        );
        await checkBalance({
          server,
          address: account.address,
          amountNeeded: amount,
          message: balance =>
            `You need ${amount} USDC to make this request. Your current balance is ${balance} USDC.`,
          flags,
        });
        fetchState = FetchStates.PAYMENT_REQUIRED;
      });

      coreClient.onAfterPaymentCreation(async ctx => {
        fetchState = FetchStates.PAYMENT_CREATED;
        log.info('After payment creation', ctx);
        return Promise.resolve();
      });

      coreClient.onPaymentCreationFailure(async ctx => {
        fetchState = FetchStates.PAYMENT_FAILED;
        log.info('Payment creation failure', ctx);
        return Promise.resolve();
      });
      const client = new x402HTTPClient(coreClient);

      const fetchWithPay = wrapFetchWithPayment(fetch, client);

      try {
        const response = await fetchWithPay(url, {
          method,
          body: body ? JSON.stringify(body) : undefined,
          headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...headers,
          },
        });

        if (!response.ok) {
          const baseErrorResponse = {
            success: false,
            statusCode: response.status,
            error: response.statusText,
            response: await response.text(),
            fetchState,
          };
          if (response.status === 402) {
            return mcpError('Payment required', {
              ...baseErrorResponse,
              // what else do we want to return here?
            });
          }
          return mcpError(response.statusText ?? 'Request failed', {
            ...baseErrorResponse,
          });
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
          success: true,
          statusCode: response.status,
          data: await response.text().catch(() => undefined),
          settlement: settlement,
        });
      } catch (err) {
        return mcpError(err, { tool: 'execute_call', url });
      }
    }
  );
};
