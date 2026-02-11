import { x402Client, x402HTTPClient } from '@x402/core/client';
import { encodeSIWxHeader } from '@x402/extensions/sign-in-with-x';

import { safeFetch, safeParseResponse } from '@/shared/neverthrow/fetch';
import {
  safeCreateSIWxPayload,
  safeGetPaymentRequired,
} from '@/shared/neverthrow/x402';

import {
  mcpErrorJson,
  mcpError,
  mcpSuccessResponse,
  mcpErrorFetch,
} from './response';

import { requestSchema, buildRequest } from './lib/request';

import type { RegisterTools } from '@/server/types';
import { getSiwxExtension } from '../lib/x402-extensions';

const toolName = 'fetch_with_auth';

export const registerAuthTools: RegisterTools = ({
  server,
  account,
  sessionId,
}) => {
  server.registerTool(
    toolName,
    {
      title: 'Fetch with Authentication',
      description: `HTTP fetch with automatic SIWX (Sign-In With X) authentication. Detects auth requirement, signs wallet proof, retries with credentials. For endpoints requiring identity verification without payment. EVM chains only.`,
      inputSchema: requestSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async input => {
      const httpClient = new x402HTTPClient(new x402Client());

      // Step 1: Make initial request
      const firstResult = await safeFetch(
        toolName,
        buildRequest({ input, address: account.address, sessionId })
      );

      if (firstResult.isErr()) {
        return mcpError(firstResult);
      }

      const firstResponse = firstResult.value;

      if (firstResponse.status !== 402) {
        if (!firstResponse.ok) {
          return mcpErrorFetch(toolName, firstResponse);
        }

        const parseResponseResult = await safeParseResponse(
          toolName,
          firstResponse
        );

        if (parseResponseResult.isErr()) {
          return mcpError(parseResponseResult);
        }

        return mcpSuccessResponse(parseResponseResult.value);
      }

      const getPaymentRequiredResult = await safeGetPaymentRequired(
        toolName,
        httpClient,
        firstResponse
      );

      if (getPaymentRequiredResult.isErr()) {
        return mcpError(getPaymentRequiredResult);
      }

      const paymentRequired = getPaymentRequiredResult.value;

      const siwxExtension = getSiwxExtension(paymentRequired.extensions);

      if (!siwxExtension) {
        return mcpErrorJson({
          message:
            'Endpoint returned 402 but no sign-in-with-x extension found',
          statusCode: 402,
          extensions: Object.keys(paymentRequired.extensions ?? {}),
          hint: 'This endpoint may require payment instead of authentication. Use execute_call for paid requests.',
        });
      }

      // Create signed proof using server-provided challenge
      const payloadResult = await safeCreateSIWxPayload(
        toolName,
        siwxExtension,
        account
      );

      if (payloadResult.isErr()) {
        return mcpError(payloadResult);
      }

      const siwxHeader = encodeSIWxHeader(payloadResult.value);

      // Step 6: Retry with SIGN-IN-WITH-X header
      const authedRequest = buildRequest({
        input,
        address: account.address,
        sessionId,
      });
      authedRequest.headers.set('SIGN-IN-WITH-X', siwxHeader);

      const authedResult = await safeFetch(toolName, authedRequest);

      if (authedResult.isErr()) {
        return mcpError(authedResult);
      }

      const authedResponse = authedResult.value;

      if (!authedResponse.ok) {
        return mcpErrorFetch(toolName, authedResponse);
      }

      const parseResponseResult = await safeParseResponse(
        toolName,
        authedResponse
      );

      if (parseResponseResult.isErr()) {
        return mcpError(parseResponseResult);
      }

      return mcpSuccessResponse(parseResponseResult.value);
    }
  );
};
