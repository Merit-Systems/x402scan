#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Clients } from './cli/install/clients';

const isClaudeCode = Boolean(process.env.CLAUDECODE);
const defaultYes = isClaudeCode || Boolean(process.env.CI);

void yargs(hideBin(process.argv))
  .scriptName('@x402scan/mcp')
  .usage('$0 [command] [options]')
  .option('dev', {
    type: 'boolean',
    description: 'Enable dev mode (use localhost endpoints)',
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
  .option('format', {
    type: 'string',
    description:
      'Output format: json (default for pipes) or pretty (default for TTY)',
    choices: ['json', 'pretty'],
  })
  .option('quiet', {
    alias: 'q',
    type: 'boolean',
    description: 'Suppress stderr output',
    default: false,
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Enable verbose logging (debug output to stderr)',
    default: false,
  })
  .middleware(async argv => {
    // Configure CLI context for shared modules (like logging)
    if (argv.verbose) {
      const { configureCliContext } = await import('@/shared/cli-context');
      configureCliContext({ verbose: true });
    }
  })
  // ============================================================
  // Core CLI Commands (for agent/programmatic use)
  // ============================================================
  .command(
    'fetch <url>',
    'HTTP fetch with automatic x402 payment handling',
    yargs =>
      yargs
        .positional('url', {
          type: 'string',
          description: 'The endpoint URL to fetch',
          demandOption: true,
        })
        .option('method', {
          alias: 'm',
          type: 'string',
          description: 'HTTP method',
          choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET',
        })
        .option('body', {
          alias: 'b',
          type: 'string',
          description: 'Request body as JSON string',
        })
        .option('headers', {
          alias: 'H',
          type: 'string',
          description: 'Additional headers as JSON object',
        }),
    async args => {
      const { fetchCommand } = await import('@/cli/commands');
      await fetchCommand(
        {
          url: args.url,
          method: args.method,
          body: args.body,
          headers: args.headers,
        },
        args
      );
    }
  )
  .command(
    'check <url>',
    'Check endpoint for x402 pricing and schema without making payment',
    yargs =>
      yargs
        .positional('url', {
          type: 'string',
          description: 'The endpoint URL to check',
          demandOption: true,
        })
        .option('method', {
          alias: 'm',
          type: 'string',
          description: 'HTTP method',
          choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET',
        })
        .option('body', {
          alias: 'b',
          type: 'string',
          description: 'Request body as JSON string',
        })
        .option('headers', {
          alias: 'H',
          type: 'string',
          description: 'Additional headers as JSON object',
        }),
    async args => {
      const { checkCommand } = await import('@/cli/commands');
      await checkCommand(
        {
          url: args.url,
          method: args.method,
          body: args.body,
          headers: args.headers,
        },
        args
      );
    }
  )
  .command(
    'discover <url>',
    'Discover x402-protected endpoints on an origin',
    yargs =>
      yargs.positional('url', {
        type: 'string',
        description: 'The origin URL to discover endpoints from',
        demandOption: true,
      }),
    async args => {
      const { discoverCommand } = await import('@/cli/commands');
      await discoverCommand({ url: args.url }, args);
    }
  )
  .command(
    'wallet',
    'Wallet management commands',
    yargs =>
      yargs
        .command(
          'info',
          'Get wallet address, balance, and deposit link',
          yargs => yargs,
          async args => {
            const { walletInfoCommand } = await import('@/cli/commands');
            await walletInfoCommand({}, args);
          }
        )
        .command(
          'redeem <code>',
          'Redeem an invite code for free USDC',
          yargs =>
            yargs.positional('code', {
              type: 'string',
              description: 'The invite code to redeem',
              demandOption: true,
            }),
          async args => {
            const { walletRedeemCommand } = await import('@/cli/commands');
            await walletRedeemCommand({ code: args.code }, args);
          }
        )
        .demandCommand(1, 'You must specify a wallet subcommand')
        .strict(),
    () => {
      // Show help for wallet command
    }
  )
  .command(
    'report-error',
    'Report a critical bug to the x402scan team (emergency only)',
    yargs =>
      yargs
        .option('tool', {
          type: 'string',
          description: 'The tool/command that failed',
          demandOption: true,
        })
        .option('summary', {
          type: 'string',
          description: '1-2 sentence summary of the issue',
          demandOption: true,
        })
        .option('error-message', {
          type: 'string',
          description: 'The error message',
          demandOption: true,
        })
        .option('resource', {
          type: 'string',
          description: 'The x402 resource URL (if applicable)',
        })
        .option('stack', {
          type: 'string',
          description: 'Stack trace (if available)',
        })
        .option('full-report', {
          type: 'string',
          description: 'Detailed report with context and repro steps',
        }),
    async args => {
      const { reportErrorCommand } = await import('@/cli/commands');
      await reportErrorCommand(
        {
          tool: args.tool,
          summary: args.summary,
          errorMessage: args.errorMessage,
          resource: args.resource,
          stack: args.stack,
          fullReport: args.fullReport,
        },
        args
      );
    }
  )
  // ============================================================
  // Server & Installation Commands
  // ============================================================
  .command(
    ['$0', 'server'],
    'Start the MCP server (default when no command specified)',
    yargs => yargs,
    async args => {
      const { serverCommand } = await import('@/cli/commands');
      await serverCommand(args);
    }
  )
  .command(
    'install',
    'Install the MCP server configuration for a client',
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
    'Open the funding page to add USDC to your wallet',
    yargs => yargs,
    async args => {
      const { fundMcpServer } = await import('@/cli/fund');
      await fundMcpServer(args);
    }
  )
  .example(
    '$0 fetch "https://enrichx402.com/api/apollo/people-enrich" -m POST -b \'{"email":"user@example.com"}\'',
    'Fetch with x402 payment'
  )
  .example(
    '$0 check "https://enrichx402.com/api/apollo/people-enrich"',
    'Check endpoint pricing'
  )
  .example(
    '$0 discover "https://enrichx402.com"',
    'Discover endpoints on origin'
  )
  .example('$0 wallet info', 'Get wallet balance')
  .example('$0 wallet redeem ABC123', 'Redeem invite code')
  .example('$0', 'Start MCP server (default)')
  .example('$0 install --client cursor', 'Install MCP for Cursor')
  .strict()
  .help()
  .version()
  .parseAsync()
  .catch(err => {
    // Output error in JSON format for agent consumption
    const response = {
      success: false,
      error: {
        code: 'GENERAL_ERROR',
        message: err instanceof Error ? err.message : String(err),
        surface: 'cli',
        cause: 'unknown',
      },
    };
    console.log(JSON.stringify(response, null, 2));
    process.exit(1);
  });
