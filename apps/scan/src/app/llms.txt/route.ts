import { env } from '@/env';

const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');

const REPO_URL = 'https://github.com/Merit-Systems/x402scan';

/**
 * /llms.txt — a curated, Markdown map of the site for LLMs and agents.
 *
 * Follows the https://llmstxt.org/ format: an H1 name, a `>` summary
 * blockquote, optional prose, then H2 sections of `[name](url): description`
 * links. The `## Optional` section holds links that can be skipped when a
 * shorter context is needed. Links point at clean Markdown / machine-readable
 * representations where they exist (e.g. the `.md` docs, the OpenAPI spec, and
 * the RFC 9727 API catalog). URLs are absolute and env-driven so they resolve
 * correctly on production and preview deploys.
 */
const body = `# x402scan

> x402scan is the ecosystem explorer and registry for x402, an open standard for internet-native payments where API resources are purchased just-in-time with stablecoins (USDC) — no accounts, no API keys, no subscriptions. It indexes x402 servers, transactions, buyers, merchants, and facilitators across Base and Solana, and exposes that data through a public API and an MCP server for agents.

x402 lets AI agents and applications pay for API resources on demand over HTTP 402. x402scan makes the ecosystem observable: it tracks payment volume, ranks buyers and merchants, catalogs discoverable resources, and lets you register your own x402 endpoints so agents can find and pay for them.

## Explore
- [Overview](${baseUrl}/): live x402 transaction volume, top buyers, merchants, and facilitators
- [What is x402](${baseUrl}/x402): explainer for the x402 payment standard
- [Agentic commerce](${baseUrl}/agentic-commerce): how agents transact over x402
- [Resources](${baseUrl}/resources): indexed x402 API resources you can call
- [Facilitators](${baseUrl}/facilitators): x402 facilitators and their stats
- [Networks](${baseUrl}/networks): activity broken down by chain (Base, Solana)

## For agents and developers
- [OpenAPI specification](${baseUrl}/openapi.json): machine-readable spec for the x402scan public API (/api/x402)
- [API catalog](${baseUrl}/.well-known/api-catalog): RFC 9727 catalog linking the spec, docs, and health endpoint
- [API health](${baseUrl}/api/health): liveness endpoint
- [MCP server](${baseUrl}/mcp): install the x402scan MCP server (npm \`@x402scan/mcp\`) to call x402 APIs with automatic payment handling
- [MCP guide](${baseUrl}/mcp/guide): using the MCP server for agentic workflows
- [Register a resource](${baseUrl}/resources/register): add your x402 endpoint to the registry

The public API mixes paid and free endpoints: most read endpoints require a small x402 micropayment (~$0.01–$0.02, sent via an \`X-Payment\` header); registry write endpoints use SIWX wallet authentication and are free. See the OpenAPI spec for the full endpoint list and input schemas.

## Documentation
- [Discovery guide](${baseUrl}/discovery): make your x402 server discoverable by agents
- [Discovery spec (Markdown)](${baseUrl}/discovery/spec.md): the integration and discovery contract
- [Architecture (Markdown)](${baseUrl}/discovery/architecture.md): how discovery works end to end
- [GitHub repository](${REPO_URL}): source code and README

## Optional
- [Privacy policy (Markdown)](${baseUrl}/privacy.md)
- [Terms of service (Markdown)](${baseUrl}/tos.md)
`;

export function GET() {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
