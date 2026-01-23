import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerFetchX402ResourceTool } from './tools/x402-fetch';
import { registerAuthTools } from './tools/auth-fetch';
import { registerWalletTools } from './tools/wallet';
import { registerCheckX402EndpointTool } from './tools/check-endpoint';
import { registerRedeemInviteTool } from './tools/redeem-invite';
import { registerTelemetryTools } from './tools/telemetry';

import { registerOrigins } from './resources/origins';

import { log } from '@/shared/log';
import { getWallet } from '@/shared/wallet';

import type { Command } from '@/types';
import { registerDiscoveryTools } from './tools/discover-resources';
import { redeemInviteCode } from '@/shared/redeem-invite';
import { MCP_VERSION } from './lib/version';
import { outro } from '@clack/prompts';
import chalk from 'chalk';

export const startServer: Command = async flags => {
  log.info('Starting x402scan-mcp...');

  const { dev, invite } = flags;

  const walletResult = await getWallet();

  if (walletResult.isErr()) {
    log.error(JSON.stringify(walletResult.error, null, 2));
    outro(chalk.bold.red('Failed to get wallet'));
    process.exit(1);
  }

  const { account } = walletResult.value;

  const code = invite ?? process.env.INVITE_CODE;

  if (code) {
    await redeemInviteCode({
      code,
      dev,
      address: account.address,
      surface: 'startServer',
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
