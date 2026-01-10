import { createMcpHandler, withMcpAuth } from 'mcp-handler';

import { Permi, toViemAccount } from '@permi/ts';

import { z } from 'zod';

import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { env } from '@/env';
import { wrapFetchWithPayment } from '@/lib/x402/wrap-fetch';
import { Signer } from 'x402-fetch';
import { searchResourcesCombined } from '@/services/resource-search/combined-search';
import { buildRequest } from '@/lib/x402/build-request';
import { parseX402Response } from '@/lib/x402/schema';
import { formatCurrency } from '@/lib/utils';
import { verifyAccessToken } from '../../_lib/access-token';
import { getUserWithAccounts } from '@/services/db/user/user';

const getPermi = (accessToken: string) => {
  return new Permi({
    getAccessToken: () => accessToken,
  });
};

const getPermiSigner = async (accessToken: string) => {
  const permi = getPermi(accessToken);
  return await toViemAccount(permi);
};

const handler = createMcpHandler(
  server => {
    server.registerTool(
      'get_address',
      {
        title: 'Get Address',
        description: 'Gets the address for the current user.',
        inputSchema: {},
      },
      async ({}, extra) => {
        const accessToken = extra.authInfo?.token;
        if (!accessToken) {
          throw new Error('No access token provided');
        }
        const permi = getPermi(accessToken);
        try {
          const address = await permi.address();
          return {
            content: [{ type: 'text', text: address }],
          };
        } catch (error) {
          console.error(error);
          throw new Error('Failed to get address');
        }
      }
    );

    server.registerTool(
      'get_balance',
      {
        title: 'Get Balance',
        description: 'Gets the user&apos;s USDC balance.',
        inputSchema: {},
      },
      async ({}, extra) => {
        const accessToken = extra.authInfo?.token;
        if (!accessToken) {
          throw new Error('No access token provided');
        }
        const permi = getPermi(accessToken);
        const balance = await permi.balance();
        return {
          content: [{ type: 'text', text: formatCurrency(balance) }],
        };
      }
    );

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
        const permi = getPermi(accessToken);

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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                response.results.slice(0, limit).map(result => {
                  return {
                    id: result.id,
                    resource: result.resource,
                    type: result.type,
                  };
                })
              ),
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
        const parsed = parseX402Response(await response.json());
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
        description:
          'Fetches data from a x402 resource. You must provide the bodyFields and queryParams if the resource expects them.',
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
          bodyFields: z.record(z.string(), z.unknown()).optional(),
          queryParams: z.record(z.string(), z.any()).optional(),
        },
      },
      async ({ url, method, bodyType, bodyFields, queryParams }, extra) => {
        const accessToken = extra.authInfo?.token;
        if (!accessToken) {
          throw new Error('No access token provided');
        }
        const signer = await getPermiSigner(accessToken);

        const fetchWithPay = wrapFetchWithPayment(fetch, signer as Signer);

        const { url: requestUrl, requestInit } = buildRequest({
          url,
          method,
          bodyType,
          body: bodyFields ?? undefined,
          query: queryParams,
        });

        try {
          const response = await fetchWithPay(requestUrl, requestInit);
          if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
          }
          const data = (await response.json()) as unknown;
          return {
            content: [{ type: 'text', text: JSON.stringify(data) }],
          };
        } catch (error) {
          console.error(error);
          throw new Error('Failed to fetch data');
        }
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
  _: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;

  const { user_id } = await verifyAccessToken(bearerToken);

  const userWithAccounts = await getUserWithAccounts(user_id);

  if (!userWithAccounts) {
    throw new Error('User not found');
  }

  console.log('userWithAccounts', userWithAccounts);

  if (
    !userWithAccounts.accounts.some(account => account.provider === 'permi')
  ) {
    throw new Error('User does not have a Permi account');
  }

  return {
    token: bearerToken,
    scopes: ['spend'],
    clientId: env.PERMI_APP_ID,
    extra: { userId: userWithAccounts.id },
  };
};

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  requiredScopes: ['spend'],
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
});

export { authHandler as GET, authHandler as POST };
