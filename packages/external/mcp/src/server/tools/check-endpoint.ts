import { x402Client, x402HTTPClient } from '@x402/core/client';

import { safeFetch } from '@/shared/neverthrow/fetch';

import { mcpError, mcpFetchResponse, mcpSuccessJson } from './response';

import { log } from '@/shared/log';
import { tokenStringToNumber } from '@/shared/token';
import { safeGetPaymentRequired } from '@/shared/neverthrow/x402';

import { getInputSchema } from '../lib/x402-extensions';
import { requestSchema, buildRequest } from './lib/request';

import type { RegisterTools } from '@/server/types';
import type { JsonObject } from '@/shared/neverthrow/json/types';

const toolName = 'check_endpoint_schema';

export const registerCheckX402EndpointTool: RegisterTools = ({
  server,
  account,
  sessionId,
}) => {
  server.registerTool(
    toolName,
    {
      title: 'Check Endpoint Schema',
      description: `Probe endpoint to check if x402-protected. Returns pricing, input schema, payment methods. Use before fetch to preview costs. No payment made.`,
      inputSchema: requestSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async input => {
      log.info('Querying endpoint', input);

      const responseResult = await safeFetch(
        toolName,
        buildRequest({ input, address: account.address, sessionId })
      );

      if (responseResult.isErr()) {
        return mcpError(responseResult);
      }

      const response = responseResult.value;

      if (response.status !== 402) {
        return await mcpFetchResponse({
          surface: toolName,
          fetchResult: responseResult,
          extra: {
            requiresPayment: false,
          },
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
          schema: getInputSchema(extensions) as JsonObject,
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
