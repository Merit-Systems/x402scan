import { x402Client, x402HTTPClient } from '@x402/core/client';

import { safeFetch, safeParseResponse } from '@/shared/neverthrow/fetch';

import { mcpError, mcpSuccess } from '@/server/tools/lib/response';
import { requestSchema, buildRequest } from './lib/request';

import { log } from '@/shared/log';

import { safeGetPaymentRequired } from '@/shared/neverthrow/x402';

import { getSchema } from '../lib/extract-schema';
import { tokenStringToNumber } from '@/shared/token';

import type { RegisterTools } from '@/server/types';

const toolName = 'check-x402-endpoint';

export const registerCheckX402EndpointTool: RegisterTools = ({ server }) => {
  server.registerTool(
    toolName,
    {
      description:
        'Check if an endpoint is x402-protected and get pricing options, schema, and auth requirements (if applicable).',
      inputSchema: requestSchema,
    },
    async input => {
      log.info('Querying endpoint', input);

      const responseResult = await safeFetch(toolName, buildRequest(input));

      if (responseResult.isErr()) {
        return mcpError(responseResult.error);
      }

      const response = responseResult.value;

      if (response.status !== 402) {
        const parseResponse = await safeParseResponse(toolName, response);
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

      const client = new x402HTTPClient(new x402Client());

      const paymentRequiredResult = await safeGetPaymentRequired(
        toolName,
        client,
        response
      );

      if (paymentRequiredResult.isErr()) {
        return mcpError(paymentRequiredResult.error);
      }

      const { resource, extensions, accepts } = paymentRequiredResult.value;

      return mcpSuccess({
        requiresPayment: true,
        statusCode: response.status,
        routeDetails: {
          ...resource,
          schema: getSchema(extensions),
          paymentMethods: accepts.map(accept => ({
            price: tokenStringToNumber(accept.amount),
            network: accept.network,
            asset: accept.asset,
          })),
        },
      });
    }
  );
};
