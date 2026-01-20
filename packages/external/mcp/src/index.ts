#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

void yargs(hideBin(process.argv))
  .scriptName('@x402scan/mcp')
  .option('dev', {
    type: 'boolean',
    description: 'Enable dev mode',
    default: false,
  })
  .option('invite', {
    type: 'string',
    description: 'Invite code to redeem for starter money',
    required: false,
  })
  .command(
    '$0',
    'Start the MCP server',
    yargs => yargs,
    async args => {
      const { startServer } = await import('@/server');
      await startServer(args);
    }
  )
  .command(
    'install',
    'Install the MCP server',
    yargs =>
      yargs.option('client', {
        type: 'string',
        description: 'The client name',
        required: false,
      }),
    async args => {
      const { installMcpServer } = await import('@/install');
      await installMcpServer(args);
    }
  )
  .command(
    'fund',
    'Open the funding page',
    yargs => yargs,
    async args => {
      const { fundMcpServer } = await import('@/fund');
      await fundMcpServer(args);
    }
  )
  .strict()
  .demandCommand(0, 1, '', 'Too many commands provided')
  .help()
  .parseAsync()
  .catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
