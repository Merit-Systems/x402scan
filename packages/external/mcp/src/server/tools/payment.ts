/**
 * Payment tools - query, validate, execute
 */

import { mcpSuccess, mcpError, formatUSDC } from '@/server/lib/response';

import {
  createClient,
  makeRequest,
  queryEndpoint,
} from '@/server/lib/x402/client';

import { extractV1Schema } from '@/server/lib/x402/protocol';
import { getChainName } from '@/server/lib/networks';
import { requestSchema, requestWithHeadersSchema } from '@/server/lib/schemas';

import type { RegisterTools } from '@/server/types';

export const registerPaymentTools: RegisterTools = ({ server, account }) => {
  // query_endpoint - probe for pricing without payment
  server.registerTool(
    'query_endpoint',
    {
      description:
        'Probe an x402-protected endpoint to get pricing and requirements without payment. Returns payment options, Bazaar schema, and Sign-In-With-X auth requirements (x402 v2) if available.',
      inputSchema: requestSchema,
    },
    async ({ url, method, body }) => {
      try {
        const result = await queryEndpoint(url, { method, body });

        if (!result.success) {
          return mcpError(result.error ?? 'Failed to query endpoint', {
            statusCode: result.statusCode,
            parseErrors: result.parseErrors,
            rawHeaders: result.rawHeaders,
            rawBody: result.rawBody,
          });
        }

        if (result.statusCode !== 402) {
          return mcpSuccess({
            isX402Endpoint: false,
            statusCode: result.statusCode,
            message: 'This endpoint does not require payment',
            rawHeaders: result.rawHeaders,
          });
        }

        const pr = result.paymentRequired!;
        const requirements = pr.accepts.map(req => ({
          scheme: req.scheme,
          network: req.network,
          networkName: getChainName(req.network),
          price: formatUSDC(BigInt(req.amount)),
          priceRaw: req.amount,
          asset: req.asset,
          payTo: req.payTo,
          maxTimeoutSeconds: req.maxTimeoutSeconds,
          extra: req.extra,
        }));

        const response: Record<string, unknown> = {
          isX402Endpoint: true,
          x402Version: pr.x402Version,
          requirements,
          ...(pr.resource && { resource: pr.resource }),
          ...(pr.error && { error: pr.error }),
        };

        // Bazaar extension (v2)
        if (pr.extensions?.bazaar) {
          const bazaar = pr.extensions.bazaar as Record<string, unknown>;
          response.bazaar = {
            info: bazaar.info,
            schema: bazaar.schema,
            examples: bazaar.examples,
            hasBazaarExtension: true,
          };
        } else if (pr.x402Version === 1 && result.rawBody) {
          // V1 - extract from outputSchema
          const v1Body = result.rawBody as { accepts?: unknown[] };
          const firstAccept = v1Body.accepts?.[0];
          if (firstAccept) {
            const discoveryInfo = extractV1Schema(firstAccept);
            if (discoveryInfo) {
              response.bazaar = {
                info: discoveryInfo,
                schema: null,
                hasBazaarExtension: true,
                sourceVersion: 1,
              };
            }
          }
        }

        // Sign-In-With-X extension (v2)
        if (pr.extensions?.['sign-in-with-x']) {
          const siwx = pr.extensions['sign-in-with-x'] as {
            info?: Record<string, unknown>;
            schema?: Record<string, unknown>;
          };
          const info = siwx.info ?? {};
          const requiredFields = [
            'domain',
            'uri',
            'version',
            'chainId',
            'nonce',
            'issuedAt',
          ];
          const missingFields = requiredFields.filter(f => !info[f]);
          const validationErrors: string[] = [];

          if (!siwx.info) validationErrors.push('Missing "info" object');
          else if (missingFields.length > 0)
            validationErrors.push(`Missing: ${missingFields.join(', ')}`);
          if (!siwx.schema) validationErrors.push('Missing "schema" object');

          response.signInWithX = {
            required: true,
            valid: validationErrors.length === 0,
            validationErrors:
              validationErrors.length > 0 ? validationErrors : undefined,
            info: siwx.info,
            schema: siwx.schema,
            usage:
              'Use authed_call tool to make authenticated requests to this endpoint',
          };
        }

        return mcpSuccess(response);
      } catch (err) {
        return mcpError(err, { tool: 'query_endpoint', url });
      }
    }
  );

  // execute_call - make paid request
  server.registerTool(
    'execute_call',
    {
      description:
        'Make a paid request to an x402-protected endpoint. Handles 402 payment flow automatically.',
      inputSchema: requestWithHeadersSchema,
    },
    async ({ url, method, body, headers }) => {
      try {
        const client = createClient(account);
        const result = await makeRequest(client, url, {
          method,
          body,
          headers,
        });

        if (!result.success) {
          return mcpError(result.error?.message ?? 'Request failed', {
            success: false,
            statusCode: result.statusCode,
            error: result.error,
            ...(result.paymentRequired && {
              paymentRequired: {
                x402Version: result.paymentRequired.x402Version,
                requirements: result.paymentRequired.accepts.map(req => ({
                  network: req.network,
                  networkName: getChainName(req.network),
                  price: formatUSDC(BigInt(req.amount)),
                  priceRaw: req.amount,
                })),
              },
            }),
          });
        }

        const amount = result.paymentRequired?.accepts?.[0]?.amount;
        const response = {
          success: true,
          statusCode: result.statusCode,
          data: result.data,
          ...(result.settlement && {
            settlement: {
              transactionHash: result.settlement.transactionHash,
              network: result.settlement.network,
              networkName: getChainName(result.settlement.network),
              payer: account.address,
              ...(amount && { amountPaid: formatUSDC(BigInt(amount)) }),
            },
          }),
          ...(result.paymentRequired && {
            x402Version: result.paymentRequired.x402Version,
          }),
        };

        return mcpSuccess(response);
      } catch (err) {
        return mcpError(err, { tool: 'execute_call', url });
      }
    }
  );
};
