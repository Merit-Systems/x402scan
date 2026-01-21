import { x402Client, x402HTTPClient } from '@x402/core/client';

import { mcpError, mcpSuccess } from '@/server/lib/response';
import { requestSchema } from '@/server/lib/schemas';

import { log } from '@/shared/log';

import { getRouteDetails } from '../lib/x402/get-route-details';

import type { RegisterTools } from '@/server/types';
import { safeFetch, safeParseResponse } from '@x402scan/neverthrow/fetch';
import { buildRequest } from '../lib/build-request';

const surface = 'check-x402-endpoint';

export const registerCheckX402EndpointTool: RegisterTools = ({ server }) => {
  server.registerTool(
    'check-x402-endpoint',
    {
      description:
        'Check if an endpoint is x402-protected and get pricing options, schema, and auth requirements (if applicable).',
      inputSchema: requestSchema,
    },
    async input => {
      log.info('Querying endpoint', input);

      const responseResult = await safeFetch(surface, buildRequest(input));

      if (responseResult.isErr()) {
        return mcpError(responseResult.error);
      }

      const response = responseResult.value;

      const parseResponse = await safeParseResponse(surface, response);

      if (response.status !== 402) {
        if (parseResponse.isErr()) {
          return mcpSuccess({
            statusCode: response.status,
            requiresPayment: false,
            error: 'Could not parse response',
          });
        }
        return mcpSuccess({
          statusCode: response.status,
          requiresPayment: false,
          type: parseResponse.value.type,
          ...(['json', 'text'].includes(parseResponse.value.type)
            ? { data: parseResponse.value.data }
            : {}),
        });
      }

      if (parseResponse.isErr()) {
        return mcpSuccess({
          statusCode: response.status,
          requiresPayment: true,
          error: 'Could not parse response',
        });
      }

      const { type, data } = parseResponse.value;

      const client = new x402HTTPClient(new x402Client());

      const routeDetails = getRouteDetails(
        client.getPaymentRequiredResponse(
          name => response.headers.get(name),
          type === 'json' ? data : undefined
        )
      );

      return mcpSuccess({
        requiresPayment: true,
        statusCode: response.status,
        routeDetails,
      });
    }
  );
};
