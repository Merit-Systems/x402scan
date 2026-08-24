import { NPM_MCP_URL, ORG, REPO_URL, SITE_NAME, SITE_URL } from '@/lib/site';

/**
 * Manifest describing the first-party MCP server, served at
 * `/.well-known/mcp.json` (and `/.well-known/mcp`). There is no ratified
 * well-known format for MCP yet, so this mirrors the de-facto shape used by
 * registries (name / description / transports / tools) and points at the
 * npm package, which runs over stdio. A hosted Streamable-HTTP endpoint is
 * not offered today; when it is, add a `streamable-http` transport here.
 */
const MCP_MANIFEST = {
  name: 'x402scan',
  displayName: `${SITE_NAME} MCP`,
  description:
    'Call any x402-protected API with automatic USDC payment handling, check endpoint prices and schemas, discover x402 resources on an origin, and manage the agent wallet.',
  version: '0.3.1',
  homepage: `${SITE_URL}/mcp`,
  documentation: `${SITE_URL}/mcp/guide`,
  repository: `${REPO_URL}/tree/main/packages/external/mcp`,
  license: 'MIT',
  vendor: { name: ORG.name, url: ORG.url },
  packages: [
    {
      registry: 'npm',
      name: '@x402scan/mcp',
      url: NPM_MCP_URL,
      runtime: 'node',
    },
  ],
  transports: [
    {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@x402scan/mcp'],
    },
  ],
  install: {
    claudeCode: 'claude mcp add x402scan -- npx -y @x402scan/mcp',
    guided: 'npx @x402scan/mcp install',
    config: {
      mcpServers: {
        x402scan: { command: 'npx', args: ['-y', '@x402scan/mcp'] },
      },
    },
  },
  tools: [
    {
      name: 'fetch',
      description:
        'HTTP request to any URL; pays x402 402 challenges automatically and retries.',
    },
    {
      name: 'fetch_with_auth',
      description:
        'HTTP request with SIWX wallet sign-in for identity-gated endpoints.',
    },
    {
      name: 'check_endpoint_schema',
      description:
        'Inspect whether an endpoint is x402-protected and return its price, schema and auth mode without paying.',
    },
    {
      name: 'discover_api_endpoints',
      description:
        'List x402 resources exposed by an origin via openapi.json or /.well-known/x402.',
    },
    {
      name: 'get_wallet_info',
      description: 'Wallet address, USDC balance and deposit link.',
    },
    {
      name: 'redeem_invite',
      description: 'Redeem an invite code for starter USDC.',
    },
    {
      name: 'report_error',
      description: 'Report a critical bug to the x402scan team.',
    },
  ],
  cli: {
    command: 'npx @x402scan/mcp',
    commands: ['fetch', 'check', 'discover', 'wallet info', 'install', 'fund'],
  },
  relatedResources: {
    openapi: `${SITE_URL}/openapi.json`,
    llms: `${SITE_URL}/llms.txt`,
    apiCatalog: `${SITE_URL}/.well-known/api-catalog`,
    docs: `${SITE_URL}/docs`,
  },
} as const;

export function mcpManifestResponse() {
  return new Response(JSON.stringify(MCP_MANIFEST, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
