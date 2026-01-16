import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerPaymentTools } from './tools/payment';
import { registerAuthTools } from './tools/auth';
import { registerWalletTools } from './tools/wallet';

import { log } from '@/lib/log';

import type { Command } from '@/types';
import { getWallet } from '@/lib/wallet';
import { registerOrigins } from './resources/origins';

export const startServer: Command = async flags => {
  log.info('Starting x402scan-mcp...');

  const { account } = await getWallet();

  const server = new McpServer(
    {
      name: '@x402scan/mcp',
      version: '0.0.1',
    },
    {
      capabilities: {
        resources: {
          subscribe: true,
          listChanged: true,
        },
      },
    }
  );

  const props = {
    server,
    account,
    flags,
  };

  registerPaymentTools(props);
  registerAuthTools(props);
  registerWalletTools(props);

  await registerOrigins({ server, flags });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = async () => {
    log.info('Shutting down...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
};
