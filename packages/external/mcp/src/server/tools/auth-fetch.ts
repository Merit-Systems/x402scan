import { x402Client, x402HTTPClient } from '@x402/core/client';
import { encodeSIWxHeader } from '@x402scan/siwx';

import { safeFetch } from '@/shared/neverthrow/fetch';
import {
  safeCreateSIWxPayload,
  safeGetPaymentRequired,
} from '@/shared/neverthrow/x402';

import { mcpErrorJson, mcpError, mcpFetchResponse } from './response';

import { requestSchema, buildRequest } from './lib/request';

import { getSiwxExtension } from '../lib/x402-extensions';

import type { SIWxExtensionInfo } from '@x402scan/siwx/types';
import type { RegisterTools } from '@/server/types';

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
        return await mcpFetchResponse({
          surface: toolName,
          fetchResult: firstResult,
        });
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

      const serverInfo = siwxExtension;

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
      const authedRequest = buildRequest({
        input,
        address: account.address,
        sessionId,
      });
      authedRequest.headers.set('SIGN-IN-WITH-X', siwxHeader);

      const authedResult = await safeFetch(toolName, authedRequest);

      return await mcpFetchResponse({
        surface: toolName,
        fetchResult: authedResult,
      });
    }
  );
};
