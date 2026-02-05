#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Clients } from './cli/install/clients';

const isClaudeCode = Boolean(process.env.CLAUDECODE);
const defaultYes = isClaudeCode || Boolean(process.env.CI);

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
  .option('yes', {
    alias: 'y',
    type: 'boolean',
    description: 'Yes to all prompts',
    default: defaultYes ? true : undefined,
  })
  .option('sessionId', {
    type: 'string',
    description: 'Session ID for matching requests (auto-generated if not provided)',
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
        default: isClaudeCode ? Clients.ClaudeCode : undefined,
      }),
    async args => {
      const { installMcpServer } = await import('@/cli/install');
      await installMcpServer(args);
    }
  )
  .command(
    'fund',
    'Open the funding page',
    yargs => yargs,
    async args => {
      const { fundMcpServer } = await import('@/cli/fund');
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
