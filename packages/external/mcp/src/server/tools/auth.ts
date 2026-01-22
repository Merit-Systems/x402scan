import { x402Client, x402HTTPClient } from '@x402/core/client';

import { safeFetch, safeParseResponse } from '@/shared/neverthrow/fetch';
import { resultFromPromise } from '@x402scan/neverthrow';

import { mcpSuccess, mcpError } from './lib/response';
import { safeGetPaymentRequired } from '@/shared/neverthrow/x402';

import { createSIWxPayload, encodeSIWxHeader } from '@x402scan/siwx';

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
        return mcpError(firstResult.error);
      }

      const firstResponse = firstResult.value;

      // If not 402, return the response directly
      if (firstResponse.status !== 402) {
        const parseResult = await safeParseResponse(toolName, firstResponse);

        const responseHeaders = Object.fromEntries(
          firstResponse.headers.entries()
        );

        if (parseResult.isErr()) {
          return mcpError(parseResult.error);
        }

        if (!firstResponse.ok) {
          return mcpError(`HTTP ${firstResponse.status}`, {
            statusCode: firstResponse.status,
            headers: responseHeaders,
            body: parseResult.value.data,
          });
        }

        return mcpSuccess({
          statusCode: firstResponse.status,
          headers: responseHeaders,
          data: parseResult.value.data,
        });
      }

      const getPaymentRequiredResult = await safeGetPaymentRequired(
        toolName,
        httpClient,
        firstResponse
      );

      if (getPaymentRequiredResult.isErr()) {
        return mcpError(getPaymentRequiredResult.error);
      }

      const paymentRequired = getPaymentRequiredResult.value;

      const siwxExtension = paymentRequired.extensions?.['sign-in-with-x'] as
        | { info?: SIWxExtensionInfo }
        | undefined;

      if (!siwxExtension?.info) {
        return mcpError(
          'Endpoint returned 402 but no sign-in-with-x extension found',
          {
            statusCode: 402,
            x402Version: paymentRequired.x402Version,
            extensions: Object.keys(paymentRequired.extensions ?? {}),
            hint: 'This endpoint may require payment instead of authentication. Use execute_call for paid requests.',
          }
        );
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
        return mcpError(
          'Invalid sign-in-with-x extension: missing required fields',
          {
            missingFields,
            receivedInfo: serverInfo,
          }
        );
      }

      // Step 4: Check for unsupported chain types
      if (serverInfo.chainId.startsWith('solana:')) {
        return mcpError('Solana authentication not supported', {
          chainId: serverInfo.chainId,
          hint: 'This endpoint requires a Solana wallet. The MCP server currently only supports EVM wallets.',
        });
      }

      // Step 5: Create signed proof using server-provided challenge
      const payloadResult = await resultFromPromise(
        'siwx',
        toolName,
        createSIWxPayload(serverInfo, account),
        error => ({
          cause: 'siwx_create_payload',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create SIWX payload',
        })
      );

      if (payloadResult.isErr()) {
        return mcpError(payloadResult.error);
      }

      const siwxHeader = encodeSIWxHeader(payloadResult.value);

      // Step 6: Retry with SIGN-IN-WITH-X header
      const authedRequest = buildRequest(input);
      authedRequest.headers.set('SIGN-IN-WITH-X', siwxHeader);

      const authedResult = await safeFetch(toolName, authedRequest);

      if (authedResult.isErr()) {
        return mcpError(authedResult.error);
      }

      const authedResponse = authedResult.value;
      const responseHeaders = Object.fromEntries(
        authedResponse.headers.entries()
      );

      const authedParseResult = await safeParseResponse(
        toolName,
        authedResponse
      );

      if (authedParseResult.isErr()) {
        return mcpError(authedParseResult.error);
      }

      if (!authedResponse.ok) {
        return mcpError(`HTTP ${authedResponse.status} after authentication`, {
          statusCode: authedResponse.status,
          headers: responseHeaders,
          body: authedParseResult.value.data,
          authAddress: account.address,
        });
      }

      return mcpSuccess({
        statusCode: authedResponse.status,
        headers: responseHeaders,
        data: authedParseResult.value.data,
        authentication: {
          address: account.address,
          domain: serverInfo.domain,
          chainId: serverInfo.chainId,
        },
      });
    }
  );
};
