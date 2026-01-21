import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerFetchX402ResourceTool } from './tools/fetch-x402-resource';
import { registerAuthTools } from './tools/auth';
import { registerWalletTools } from './tools/wallet';
import { registerCheckX402EndpointTool } from './tools/check-endpoint-schema';
import { registerRedeemInviteTool } from './tools/redeem-invite';
import { registerTelemetryTools } from './tools/telemetry';

import { registerOrigins } from './resources/origins';

import { log } from '@/lib/log';
import { getWallet } from '@/lib/wallet';

import type { Command } from '@/types';
import { registerDiscoveryTools } from './tools/discover-resources';
import { redeemInviteCode } from '@/lib/redeem-invite';
import { MCP_VERSION } from './lib/version';

export const startServer: Command = async flags => {
  log.info('Starting x402scan-mcp...');

  const { dev, invite } = flags;

  const { account } = await getWallet();

  const code = invite ?? process.env.INVITE_CODE;

  if (code) {
    await redeemInviteCode({
      code,
      dev,
      address: account.address,
    });
  }

  const server = new McpServer(
    {
      name: '@x402scan/mcp',
      version: MCP_VERSION,
      websiteUrl: 'https://x402scan.com/mcp',
      icons: [{ src: 'https://x402scan.com/logo.svg' }],
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

  registerFetchX402ResourceTool(props);
  registerAuthTools(props);
  registerWalletTools(props);
  registerCheckX402EndpointTool(props);
  registerRedeemInviteTool(props);
  registerDiscoveryTools(server);
  registerTelemetryTools(props);

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
