/**
 * Payment tools - query, validate, execute
 */

import { mcpSuccess, mcpError } from '@/server/lib/response';

import { requestSchema, requestWithHeadersSchema } from '@/server/lib/schemas';

import { FetchStates, RegisterTools } from '@/server/types';
import { x402Client, x402HTTPClient } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { wrapFetchWithPayment } from '@x402/fetch';
import { log } from '@/lib/log';

export const registerPaymentTools: RegisterTools = ({ server, account }) => {
  // query_endpoint - probe for pricing without payment
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
    'execute_call',
    {
      description:
        'Make a paid request to an x402-protected endpoint. Handles 402 payment flow automatically.',
      inputSchema: requestWithHeadersSchema,
    },
    async ({ url, method, body, headers }) => {
      const coreClient = x402Client.fromConfig({
        schemes: [
          { network: 'eip155:8453', client: new ExactEvmScheme(account) },
        ],
      });

      let fetchState: FetchStates = FetchStates.INITIAL_REQUEST;

      coreClient.onBeforePaymentCreation(async ctx => {
        fetchState = FetchStates.PAYMENT_REQUIRED;
        log.info('Before payment creation', ctx);
        return Promise.resolve();
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
