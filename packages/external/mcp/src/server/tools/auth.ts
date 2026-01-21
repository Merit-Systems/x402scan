import { x402Client, x402HTTPClient } from '@x402/core/client';

import { mcpSuccess, mcpError } from '../lib/response';

import { normalizePaymentRequired } from '../lib/x402/protocol';

import { createSIWxPayload, encodeSIWxHeader } from '@x402scan/siwx';
import type { SIWxExtensionInfo } from '@x402scan/siwx/types';

import { requestSchema } from '@/server/lib/schemas';

import type { RegisterTools } from '@/server/types';

export const registerAuthTools: RegisterTools = ({ server, account }) => {
  server.registerTool(
    'authed_call',
    {
      description:
        'Make a request to a SIWX-protected endpoint. Handles auth flow automatically: detects SIWX requirement from 402 response, signs proof with server-provided challenge, retries.',
      inputSchema: requestSchema,
    },
    async ({ url, method, body, headers }) => {
      try {
        const httpClient = new x402HTTPClient(new x402Client());

        // Step 1: Make initial request
        const firstResponse = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body
            ? typeof body === 'string'
              ? body
              : JSON.stringify(body)
            : undefined,
        });

        // If not 402, return the response directly
        if (firstResponse.status !== 402) {
          const responseHeaders = Object.fromEntries(
            firstResponse.headers.entries()
          );

          if (firstResponse.ok) {
            let data: unknown;
            const contentType = firstResponse.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              data = await firstResponse.json();
            } else {
              data = await firstResponse.text();
            }
            return mcpSuccess({
              statusCode: firstResponse.status,
              headers: responseHeaders,
              data,
            });
          }

          let errorBody: unknown;
          try {
            errorBody = await firstResponse.json();
          } catch {
            errorBody = await firstResponse.text();
          }
          return mcpError(`HTTP ${firstResponse.status}`, {
            statusCode: firstResponse.status,
            headers: responseHeaders,
            body: errorBody,
          });
        }

        // Step 2: Parse 402 response
        let rawBody: unknown;
        try {
          rawBody = await firstResponse.clone().json();
        } catch {
          rawBody = undefined;
        }

        const rawPaymentRequired = httpClient.getPaymentRequiredResponse(
          name => firstResponse.headers.get(name),
          rawBody
        );
        const paymentRequired = normalizePaymentRequired(rawPaymentRequired);

        // Step 3: Check for sign-in-with-x extension
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
        const payload = await createSIWxPayload(serverInfo, account);
        const siwxHeader = encodeSIWxHeader(payload);

        // Step 6: Retry with SIGN-IN-WITH-X header
        const authedResponse = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'SIGN-IN-WITH-X': siwxHeader,
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        const responseHeaders = Object.fromEntries(
          authedResponse.headers.entries()
        );

        if (!authedResponse.ok) {
          let errorBody: unknown;
          try {
            errorBody = await authedResponse.json();
          } catch {
            errorBody = await authedResponse.text();
          }
          return mcpError(
            `HTTP ${authedResponse.status} after authentication`,
            {
              statusCode: authedResponse.status,
              headers: responseHeaders,
              body: errorBody,
              authAddress: account.address,
            }
          );
        }

        // Parse successful response
        let data: unknown;
        const contentType = authedResponse.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await authedResponse.json();
        } else {
          data = await authedResponse.text();
        }

        return mcpSuccess({
          statusCode: authedResponse.status,
          headers: responseHeaders,
          data,
          authentication: {
            address: account.address,
            domain: serverInfo.domain,
            chainId: serverInfo.chainId,
          },
        });
      } catch (err) {
        return mcpError(err, { tool: 'authed_call', url });
      }
    }
  );
};
