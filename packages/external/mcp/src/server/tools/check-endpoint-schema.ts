import { x402Client, x402HTTPClient } from '@x402/core/client';

import { safeFetch, safeParseResponse } from '@/shared/neverthrow/fetch';

import {
  mcpError,
  mcpErrorFetch,
  mcpSuccessJson,
  mcpSuccessResponse,
} from './response';

import { log } from '@/shared/log';
import { tokenStringToNumber } from '@/shared/token';
import { safeGetPaymentRequired } from '@/shared/neverthrow/x402';

import { getSchema } from '../lib/extract-schema';
import { requestSchema, buildRequest } from './lib/request';

import type { RegisterTools } from '@/server/types';
import type { JsonObject } from '@/shared/neverthrow/json/types';

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
        return mcpError(responseResult);
      }

      const response = responseResult.value;

      if (response.status !== 402) {
        if (!response.ok) {
          return mcpErrorFetch(toolName, {
            cause: 'http',
            message: response.statusText,
            response: response,
          });
        }

        const parseResponseResult = await safeParseResponse(toolName, response);
        if (parseResponseResult.isErr()) {
          return mcpError(parseResponseResult);
        }
        return mcpSuccessResponse(parseResponseResult.value, {
          requiresPayment: false,
        });
      }

      const client = new x402HTTPClient(new x402Client());

      const paymentRequiredResult = await safeGetPaymentRequired(
        toolName,
        client,
        response
      );

      if (paymentRequiredResult.isErr()) {
        return mcpError(paymentRequiredResult);
      }

      const { resource, extensions, accepts } = paymentRequiredResult.value;

      return mcpSuccessJson({
        requiresPayment: true,
        statusCode: response.status,
        routeDetails: {
          ...resource,
          schema: getSchema(extensions) as JsonObject,
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
