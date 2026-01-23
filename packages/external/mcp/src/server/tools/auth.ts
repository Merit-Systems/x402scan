import { x402Client, x402HTTPClient } from '@x402/core/client';
import { encodeSIWxHeader } from '@x402scan/siwx';

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

import type { SIWxExtensionInfo } from '@x402scan/siwx/types';
import type { RegisterTools } from '@/server/types';

const toolName = 'authed_call';

export const registerAuthTools: RegisterTools = ({ server, account }) => {
  server.registerTool(
    toolName,
    {
      description:
        'Make a request to a SIWX-protected endpoint. Handles auth flow automatically: detects SIWX requirement from 402 response, signs proof with server-provided challenge, retries.',
      inputSchema: requestSchema,
    },
    async input => {
      const httpClient = new x402HTTPClient(new x402Client());

      // Step 1: Make initial request
      const firstResult = await safeFetch(toolName, buildRequest(input));

      if (firstResult.isErr()) {
        return mcpError(firstResult);
      }

      const firstResponse = firstResult.value;

      if (firstResponse.status !== 402) {
        if (!firstResponse.ok) {
          return mcpErrorFetch(toolName, {
            cause: 'http',
            message: firstResponse.statusText,
            response: firstResponse,
          });
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

      const siwxExtension = paymentRequired.extensions?.['sign-in-with-x'] as
        | { info?: SIWxExtensionInfo }
        | undefined;

      if (!siwxExtension?.info) {
        return mcpErrorJson({
          message:
            'Endpoint returned 402 but no sign-in-with-x extension found',
          statusCode: 402,
          extensions: Object.keys(paymentRequired.extensions ?? {}),
          hint: 'This endpoint may require payment instead of authentication. Use execute_call for paid requests.',
        });
      }

      const serverInfo = siwxExtension.info;

      // Validate required fields
      const requiredFields = [
        'domain',
        'uri',
        'version',
        'chainId',
        'nonce',
        'issuedAt',
      ];
      const missingFields = requiredFields.filter(
        f => !serverInfo[f as keyof SIWxExtensionInfo]
      );
      if (missingFields.length > 0) {
        return mcpErrorJson({
          message: 'Invalid sign-in-with-x extension: missing required fields',
          missingFields,
          receivedInfo: { ...serverInfo },
        });
      }

      // Step 4: Check for unsupported chain types
      if (serverInfo.chainId.startsWith('solana:')) {
        return mcpErrorJson({
          message: 'Solana authentication not supported',
          chainId: serverInfo.chainId,
          hint: 'This endpoint requires a Solana wallet. The MCP server currently only supports EVM wallets.',
        });
      }

      // Step 5: Create signed proof using server-provided challenge
      const payloadResult = await safeCreateSIWxPayload(
        toolName,
        serverInfo,
        account
      );

      if (payloadResult.isErr()) {
        return mcpError(payloadResult);
      }

      const siwxHeader = encodeSIWxHeader(payloadResult.value);

      // Step 6: Retry with SIGN-IN-WITH-X header
      const authedRequest = buildRequest(input);
      authedRequest.headers.set('SIGN-IN-WITH-X', siwxHeader);

      const authedResult = await safeFetch(toolName, authedRequest);

      if (authedResult.isErr()) {
        return mcpError(authedResult);
      }

      const authedResponse = authedResult.value;

      if (!authedResponse.ok) {
        return mcpErrorFetch(toolName, {
          cause: 'http',
          message: authedResponse.statusText,
          response: authedResponse,
        });
      }

      const parseResponseResult = await safeParseResponse(
        toolName,
        authedResponse
      );

      if (parseResponseResult.isErr()) {
        return mcpError(parseResponseResult);
      }

      return mcpSuccessResponse(parseResponseResult.value, {
        authentication: {
          address: account.address,
          domain: serverInfo.domain,
          chainId: serverInfo.chainId,
        },
      });
    }
  );
};
