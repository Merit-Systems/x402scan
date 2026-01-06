import { createMcpHandler, withMcpAuth } from 'mcp-handler';

import { Permi, toViemAccount } from '@permi/ts';

import { z } from 'zod';

import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { env } from '@/env';
import { wrapFetchWithPayment } from '@/lib/x402/wrap-fetch';
import { Signer } from 'x402-fetch';
import { searchResourcesCombined } from '@/services/resource-search/combined-search';
import {
  EnhancedPaymentRequirementsSchema,
  parseX402Response,
} from '@/lib/x402/schema';

const handler = createMcpHandler(
  server => {
    server.registerTool(
      'sign_message',
      {
        title: 'Sign Message',
        description: 'Signs a message on behalf of a user.',
        inputSchema: {
          message: z.string(),
        },
      },
      async ({ message }, extra) => {
        const accessToken = extra.authInfo?.token;
        if (!accessToken) {
          throw new Error('No access token provided');
        }
        const permi = new Permi({
          getAccessToken: () => accessToken,
          baseUrl: `${env.PERMI_APP_URL}/api`,
        });

        const signature = await permi.signMessage({
          message,
        });

        return {
          content: [{ type: 'text', text: signature }],
        };
      }
    );

    server.registerTool(
      'search_resources',
      {
        title: 'Search Resources',
        description: 'Searches for resources using a natural language query.',
        inputSchema: {
          query: z.string(),
          limit: z.number().optional().default(10),
        },
      },
      async ({ query, limit }) => {
        const response = await searchResourcesCombined(
          `${query} limit ${limit}`,
          {
            queryMode: 'sql',
            refinementMode: 'reranker',
          }
        );

        response.results.slice(0, limit).map(result => {
          return {
            id: result.id,
            resource: result.resource,
            type: result.type,
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.results.slice(0, limit)),
            },
          ],
        };
      }
    );

    server.registerTool(
      'get_resource_paramaters',
      {
        title: 'Get Resource Parameters',
        description: 'Gets the parameters to invoke a resource..',
        inputSchema: {
          resource: z.url(),
        },
      },
      async ({ resource }) => {
        const response = await fetch(resource.toString());
        const body = await response.json();
        console.log(body);
        const parsed = parseX402Response(body);
        if (!parsed.success) {
          throw new Error(
            'Invalid resource data: ' + JSON.stringify(parsed.errors)
          );
        }
        const baseAccepts = parsed.data.accepts?.find(
          accept => accept.network === 'base'
        );
        if (!baseAccepts) {
          throw new Error('This resource does not accept payments on base');
        }
        const inputSchema = baseAccepts.outputSchema?.input;
        if (!inputSchema) {
          throw new Error('This resource does not have an input schema');
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(inputSchema) }],
        };
      }
    );

    server.registerTool(
      'x402_fetch',
      {
        title: 'x402 Fetch',
        description: 'Fetches data from a x402 resource.',
        inputSchema: {
          url: z.url(),
          method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
          bodyType: z.enum([
            'json',
            'form-data',
            'multipart-form-data',
            'text',
            'binary',
          ]),
          body: z.record(z.string(), z.any()).optional(),
          query: z.record(z.string(), z.any()).optional(),
        },
      },
      async ({ url, method, bodyType, body, query }, extra) => {
        const accessToken = extra.authInfo?.token;
        if (!accessToken) {
          throw new Error('No access token provided');
        }
        const permi = new Permi({
          getAccessToken: () => accessToken,
          baseUrl: `${env.PERMI_APP_URL}/api`,
        });

        const signer = await toViemAccount(permi);

        const fetchWithPay = wrapFetchWithPayment(fetch, signer as Signer);

        const requestUrl = new URL(url.toString());
        const requestMethod = method.toUpperCase();

        // Append query parameters to URL
        if (query) {
          for (const [key, value] of Object.entries(query)) {
            if (value !== undefined && value !== null) {
              if (typeof value === 'object') {
                requestUrl.searchParams.append(key, JSON.stringify(value));
              } else if (typeof value === 'number') {
                requestUrl.searchParams.append(key, String(value));
              } else {
                requestUrl.searchParams.append(key, String(value));
              }
            }
          }
        }

        const requestInit: RequestInit = {
          method: requestMethod,
        };

        // For GET/HEAD/OPTIONS, query params are already in URL, no body needed
        if (
          requestMethod === 'GET' ||
          requestMethod === 'HEAD' ||
          requestMethod === 'OPTIONS'
        ) {
          // No body for these methods
        } else if (body) {
          // Handle different body types
          switch (bodyType) {
            case 'json':
              requestInit.body = JSON.stringify(body);
              requestInit.headers = {
                'Content-Type': 'application/json',
              };
              break;
            case 'form-data':
              // Form data (application/x-www-form-urlencoded)
              const formData = new URLSearchParams();
              for (const [key, value] of Object.entries(body)) {
                if (value !== undefined && value !== null) {
                  formData.append(key, String(value));
                }
              }
              requestInit.body = formData.toString();
              requestInit.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
              };
              break;
            case 'multipart-form-data':
              // Multipart form data
              const multipartFormData = new FormData();
              for (const [key, value] of Object.entries(body)) {
                if (value !== undefined && value !== null) {
                  if (value instanceof Blob || value instanceof File) {
                    multipartFormData.append(key, value);
                  } else {
                    multipartFormData.append(key, String(value));
                  }
                }
              }
              requestInit.body = multipartFormData;
              // Don't set Content-Type header for FormData, browser will set it with boundary
              break;
            case 'text':
              requestInit.body = typeof body === 'string' ? body : String(body);
              requestInit.headers = {
                'Content-Type': 'text/plain',
              };
              break;
            case 'binary':
              // Binary data - expect body to be a Blob, ArrayBuffer, or similar
              requestInit.body = body as BodyInit;
              requestInit.headers = {
                'Content-Type': 'application/octet-stream',
              };
              break;
            default:
              // Default to JSON if bodyType is not recognized
              requestInit.body = JSON.stringify(body);
              requestInit.headers = {
                'Content-Type': 'application/json',
              };
          }
        }

        const response = await fetchWithPay(requestUrl.toString(), requestInit);

        const data = (await response.json()) as unknown;

        console.log(data);

        return {
          content: [{ type: 'text', text: JSON.stringify(data) }],
        };
      }
    );
  },
  {},
  {
    basePath: '/api', // must match where [transport] is located
    maxDuration: 60,
    verboseLogs: true,
  }
);

const verifyToken = async (
  req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;

  return Promise.resolve({
    token: bearerToken,
    scopes: ['openid'],
    clientId: env.PERMI_CLIENT_ID,
    extra: { userId: '123' },
  });
};

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  requiredScopes: ['openid'],
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
});

export { authHandler as GET, authHandler as POST };
