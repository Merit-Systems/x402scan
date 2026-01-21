import { x402Client, x402HTTPClient } from '@x402/core/client';

import { mcpError, mcpSuccess } from '@/server/lib/response';
import { requestSchema } from '@/server/lib/schemas';

import { log } from '@/shared/log';

import { getRouteDetails } from '../lib/x402/get-route-details';

import type { RegisterTools } from '@/server/types';

export const registerCheckX402EndpointTool: RegisterTools = ({ server }) => {
  server.registerTool(
    'check_x402_endpoint',
    {
      description:
        'Check if an endpoint is x402-protected and get pricing options, schema, and auth requirements (if applicable).',
      inputSchema: requestSchema,
    },
    async ({ url, method, body }) => {
      try {
        log.info('Querying endpoint', { url, method, body });
        const response = await fetch(url, {
          method,
          body: body
            ? typeof body === 'string'
              ? body
              : JSON.stringify(body)
            : undefined,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const bodyText = await response.text().catch(() => undefined);

        if (response.status !== 402) {
          return mcpSuccess({
            data: bodyText,
            statusCode: response.status,
            requiresPayment: false,
          });
        }

        const paymentRequired = new x402HTTPClient(
          new x402Client()
        ).getPaymentRequiredResponse(
          name => response.headers.get(name),
          JSON.parse(bodyText ?? '{}')
        );

        const routeDetails = getRouteDetails(paymentRequired);

        return mcpSuccess({
          requiresPayment: true,
          statusCode: response.status,
          routeDetails,
        });
      } catch (err) {
        return mcpError(err, { tool: 'query_endpoint', url });
      }
    }
  );
};
