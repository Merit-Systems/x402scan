import { createMcpHandler, withMcpAuth } from 'mcp-handler';

import { z } from 'zod';

import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

const handler = createMcpHandler(
  server => {
    server.registerTool(
      'roll_dice',
      {
        title: 'Roll Dice',
        description: 'Roll a dice with a specified number of sides.',
        inputSchema: {
          sides: z.number().int().min(2),
        },
      },
      ({ sides }) => {
        const value = 1 + Math.floor(Math.random() * sides);
        return {
          content: [{ type: 'text', text: `🎲 You rolled a ${value}!` }],
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
  await new Promise(resolve => setTimeout(resolve, 500));
  if (!bearerToken) return undefined;

  return {
    token: bearerToken,
    scopes: ['openid'],
    clientId: 'user123',
    extra: { userId: '123' },
  };
};

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  requiredScopes: ['openid'],
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
});

export { authHandler as GET, authHandler as POST };
