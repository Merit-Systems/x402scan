import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RegisterResources } from './types';

const origins = ['enrichx402.com', 'stablestudio.io'];

export const registerWellKnownResourceTemplate: RegisterResources = ({
  server,
}) => {
  server.registerResource(
    'discover-x402-resources',
    new ResourceTemplate('https://{hostname}/.well-known/x402', {
      list: async () => {
        return Promise.resolve({
          resources: origins.map(origin => ({
            name: origin,
            uri: `https://${origin}/.well-known/x402`,
            description: `x402 resources available on ${origin}`,
            mimeType: 'application/json',
            annotations: {
              audience: ['user'],
            },
          })),
        });
      },
    }),
    {
      title: 'Discover x402 Resources',
      description: 'Finds the x402 resources available on the server',
    },
    async (uri, { hostname }) => {
      console.error('uri', uri.toString());
      const response = (await fetch(uri.toString()).then(response =>
        response.json()
      )) as unknown;
      console.error('response', response);
      return {
        contents: [
          {
            uri: uri.href,
            text: `https://${hostname as string}/.well-known/x402`,
          },
        ],
      };
    }
  );
};
