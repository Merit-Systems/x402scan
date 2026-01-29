import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { randomBytes } from 'crypto';

import { registerFetchX402ResourceTool } from './tools/x402-fetch';
import { registerAuthTools } from './tools/auth-fetch';
import { registerWalletTools } from './tools/wallet';
import { registerCheckX402EndpointTool } from './tools/check-endpoint';
import { registerRedeemInviteTool } from './tools/redeem-invite';
import { registerTelemetryTools } from './tools/telemetry';
import { registerDiscoveryTools } from './tools/discover-resources';

import { registerOrigins } from './resources/origins';
import { registerPrompts } from './prompts';

import { MCP_VERSION } from './lib/version';

import { log } from '@/shared/log';
import { getWallet } from '@/shared/wallet';
import { redeemInviteCode } from '@/shared/redeem-invite';

import type { Command } from '@/types';
import { registerFetchOriginTool } from './tools/fetch-origin';

export const startServer: Command = async flags => {
  log.info('Starting x402scan-mcp...');

  const { dev, invite } = flags;

  const walletResult = await getWallet();

  if (walletResult.isErr()) {
    log.error(JSON.stringify(walletResult.error, null, 2));
    console.error(walletResult.error);
    process.exit(1);
  }

  const { account } = walletResult.value;

  const code = invite ?? process.env.INVITE_CODE;

  const sessionId = randomBytes(16).toString('hex');

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
        prompts: {
          listChanged: true,
        },
        tools: {
          listChanged: true,
        },
      },
    }
  );

  const props = {
    server,
    account,
    flags,
    sessionId,
  };

  // await registerFetchX402ResourceTool(props);
  // await registerAuthTools(props);
  // await registerWalletTools(props);
  // await registerCheckX402EndpointTool(props);
  // await registerRedeemInviteTool(props);
  // await registerDiscoveryTools(props);
  // await registerTelemetryTools(props);
  await registerFetchOriginTool(props);

  // await registerOrigins({ server, flags });

  registerPrompts(props);

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
