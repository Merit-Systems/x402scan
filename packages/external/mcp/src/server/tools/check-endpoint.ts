import { checkEndpoint } from '@/shared/operations';
import {
  mcpError,
  mcpErrorFetch,
  mcpSuccessJson,
  mcpSuccessResponse,
} from './response';
import { requestSchema, buildRequest } from './lib/request';

import type { RegisterTools } from '@/server/types';

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
      const request = buildRequest({
        input,
        address: account.address,
        sessionId,
      });

      const result = await checkEndpoint(toolName, request);

      if (result.isErr()) {
        return mcpError(result);
      }

      // Result is either CheckEndpointResult or Response
      const value = result.value;

      // Handle Response (non-ok HTTP response)
      if (value instanceof Response) {
        return mcpErrorFetch(toolName, value);
      }

      // Handle CheckEndpointPaidResult
      if ('requiresPayment' in value && value.requiresPayment) {
        return mcpSuccessJson({
          requiresPayment: true,
          statusCode: value.statusCode,
          routeDetails: value.routeDetails,
        });
      }

      // Handle CheckEndpointFreeResult
      if ('parsedResponse' in value) {
        return mcpSuccessResponse(value.parsedResponse, {
          requiresPayment: false,
          statusCode: value.statusCode,
        });
      }

      // Fallback
      return mcpSuccessJson(value);
    }
  );
};
