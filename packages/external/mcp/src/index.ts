#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getWallet } from './lib/wallet';

void yargs(hideBin(process.argv))
  .scriptName('@x402scan/mcp')
  .option('dev', {
    type: 'boolean',
    description: 'Enable dev mode',
    default: false,
  })
  .command(
    '$0',
    'Start the MCP server',
    yargs => yargs,
    async args => {
      const { account } = await getWallet();
      const { startServer } = await import('@/server');
      await startServer(account, args);
    }
  )
  .command(
    'install',
    'Install the MCP server',
    yargs =>
      yargs.option('client', {
        type: 'string',
        description: 'The client name',
        required: true,
      }),
    async args => {
      const { account, isNew } = await getWallet();
      const { installMcpServer } = await import('@/install');
      await installMcpServer(account, { ...args, isNew });
    }
  )
  .command(
    'fund',
    'Open the funding page',
    yargs => yargs,
    async args => {
      const { account } = await getWallet();
      const { fundMcpServer } = await import('@/fund');
      await fundMcpServer(account, args);
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
