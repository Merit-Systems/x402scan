import {
  successResponse,
  errorResponse,
  outputAndExit,
  type OutputFlags,
} from '@/cli/output';

import type { GlobalFlags } from '@/types';
import type { JsonObject } from '@/shared/neverthrow/json/types';

/**
 * Command schemas for agent introspection
 * These schemas describe the inputs and outputs of each CLI command
 */
const COMMAND_SCHEMAS: Record<string, object> = {
  fetch: {
    command: 'fetch',
    description:
      'HTTP fetch with automatic x402 payment. Detects 402 responses, signs payment, retries with payment headers.',
    args: {
      url: {
        type: 'string',
        required: true,
        position: 0,
        description: 'The endpoint URL to fetch',
      },
    },
    options: {
      method: {
        type: 'string',
        alias: 'm',
        default: 'GET',
        choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        description: 'HTTP method',
      },
      body: {
        type: 'string',
        alias: 'b',
        description: 'Request body as JSON string',
      },
      headers: {
        type: 'string',
        alias: 'H',
        description: 'Additional headers as JSON object string',
      },
    },
    output: {
      success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', value: true },
          data: { type: 'object', description: 'Response payload' },
          metadata: {
            type: 'object',
            optional: true,
            properties: {
              price: {
                type: 'string',
                description: 'Price paid (e.g., "$0.05")',
              },
              payment: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  transactionHash: { type: 'string', optional: true },
                },
              },
            },
          },
        },
      },
      error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', value: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'Error code' },
              message: { type: 'string' },
              surface: { type: 'string', optional: true },
              cause: { type: 'string', optional: true },
            },
          },
        },
      },
    },
    exitCodes: {
      0: 'Success',
      1: 'General error',
      2: 'Insufficient balance',
      3: 'Network error',
      4: 'Payment failed',
      5: 'Invalid input',
    },
    examples: [
      {
        description: 'Simple GET request',
        command: 'npx @x402scan/mcp fetch "https://example.com/api/data"',
      },
      {
        description: 'POST with JSON body',
        command:
          'npx @x402scan/mcp fetch "https://enrichx402.com/api/apollo/people-enrich" -m POST -b \'{"email":"user@example.com"}\'',
      },
    ],
  },
  check: {
    command: 'check',
    description:
      'Probe endpoint to check if x402-protected. Returns pricing, input schema, payment methods. No payment made.',
    args: {
      url: {
        type: 'string',
        required: true,
        position: 0,
        description: 'The endpoint URL to check',
      },
    },
    options: {
      method: {
        type: 'string',
        alias: 'm',
        default: 'GET',
        choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        description: 'HTTP method',
      },
      body: {
        type: 'string',
        alias: 'b',
        description: 'Request body as JSON string',
      },
      headers: {
        type: 'string',
        alias: 'H',
        description: 'Additional headers as JSON object string',
      },
    },
    output: {
      success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', value: true },
          data: {
            type: 'object',
            properties: {
              requiresPayment: { type: 'boolean' },
              statusCode: { type: 'number' },
              routeDetails: {
                type: 'object',
                optional: true,
                description: 'Present when requiresPayment is true',
                properties: {
                  schema: {
                    type: 'object',
                    description: 'Input schema for the endpoint',
                  },
                  paymentMethods: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        price: { type: 'number' },
                        network: { type: 'string' },
                        asset: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    examples: [
      {
        description: 'Check endpoint pricing',
        command:
          'npx @x402scan/mcp check "https://enrichx402.com/api/apollo/people-enrich"',
      },
    ],
  },
  discover: {
    command: 'discover',
    description:
      'Find x402-protected resources on an origin. Tries .well-known/x402, DNS TXT, and llms.txt.',
    args: {
      url: {
        type: 'string',
        required: true,
        position: 0,
        description: 'The origin URL to discover endpoints from',
      },
    },
    options: {},
    output: {
      success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', value: true },
          data: {
            type: 'object',
            properties: {
              found: { type: 'boolean' },
              origin: { type: 'string' },
              source: {
                type: 'string',
                enum: ['well-known', 'dns-txt', 'llms-txt'],
              },
              data: {
                type: 'object',
                description: 'Discovery document or llms.txt content',
              },
            },
          },
        },
      },
    },
    examples: [
      {
        description: 'Discover endpoints on enrichx402.com',
        command: 'npx @x402scan/mcp discover "https://enrichx402.com"',
      },
    ],
  },
  wallet: {
    command: 'wallet',
    description: 'Wallet management commands',
    subcommands: {
      info: {
        command: 'wallet info',
        description: 'Get wallet address, USDC balance, and deposit link',
        args: {},
        options: {},
        output: {
          success: {
            type: 'object',
            properties: {
              success: { type: 'boolean', value: true },
              data: {
                type: 'object',
                properties: {
                  address: {
                    type: 'string',
                    description: 'Wallet address (0x...)',
                  },
                  network: { type: 'string', description: 'CAIP-2 network ID' },
                  networkName: { type: 'string' },
                  usdcBalance: { type: 'number' },
                  isNewWallet: { type: 'boolean' },
                  depositLink: { type: 'string' },
                  message: { type: 'string', optional: true },
                },
              },
            },
          },
        },
        examples: [
          {
            description: 'Check wallet balance',
            command: 'npx @x402scan/mcp wallet info',
          },
        ],
      },
      redeem: {
        command: 'wallet redeem',
        description: 'Redeem an invite code for free USDC',
        args: {
          code: {
            type: 'string',
            required: true,
            position: 0,
            description: 'The invite code to redeem',
          },
        },
        options: {},
        output: {
          success: {
            type: 'object',
            properties: {
              success: { type: 'boolean', value: true },
              data: {
                type: 'object',
                properties: {
                  redeemed: { type: 'boolean', value: true },
                  amount: {
                    type: 'string',
                    description: 'Amount with unit (e.g., "5 USDC")',
                  },
                  txHash: { type: 'string' },
                },
              },
            },
          },
        },
        examples: [
          {
            description: 'Redeem an invite code',
            command: 'npx @x402scan/mcp wallet redeem ABC123',
          },
        ],
      },
    },
  },
  'report-error': {
    command: 'report-error',
    description:
      'Report critical MCP/CLI bugs to the x402scan team. Emergency use only.',
    args: {},
    options: {
      tool: {
        type: 'string',
        required: true,
        description: 'The tool/command that failed',
      },
      summary: {
        type: 'string',
        required: true,
        description: '1-2 sentence summary',
      },
      'error-message': {
        type: 'string',
        required: true,
        description: 'The error message',
      },
      resource: {
        type: 'string',
        description: 'x402 resource URL (if applicable)',
      },
      stack: {
        type: 'string',
        description: 'Stack trace (if available)',
      },
      'full-report': {
        type: 'string',
        description: 'Detailed report with context and repro steps',
      },
    },
    output: {
      success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', value: true },
          data: {
            type: 'object',
            properties: {
              submitted: { type: 'boolean', value: true },
              reportId: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    examples: [
      {
        description: 'Report a critical error',
        command:
          'npx @x402scan/mcp report-error --tool fetch --summary "Payment succeeded but response was empty" --error-message "Unexpected empty response"',
      },
    ],
  },
};

interface SchemaArgs {
  command: string;
}

export function schemaCommand(
  args: SchemaArgs,
  flags: GlobalFlags<OutputFlags>
): never {
  const { command } = args;

  const schema = COMMAND_SCHEMAS[command];

  if (!schema) {
    outputAndExit(
      errorResponse({
        code: 'INVALID_INPUT',
        message: `Unknown command: ${command}`,
        surface: 'cli:schema',
        cause: 'invalid_command',
        details: {
          availableCommands: Object.keys(COMMAND_SCHEMAS),
        },
      }),
      flags
    );
  }

  outputAndExit(successResponse(schema as JsonObject), flags);
}

/**
 * Get all available schemas
 * Useful for agents to discover all available commands
 */
export function getAllSchemas(): object {
  return {
    version: '1.0.0',
    commands: COMMAND_SCHEMAS,
  };
}
