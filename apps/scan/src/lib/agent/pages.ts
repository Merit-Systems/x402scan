import { readFile } from 'fs/promises';
import { join } from 'path';

import {
  API_ENDPOINTS,
  API_BASE_PATH,
  describeAuth,
} from '@/lib/agent/api-endpoints';
import {
  API_VERSION,
  API_VERSION_HEADER,
  NPM_MCP_URL,
  ORG,
  REPO_URL,
  SITE_NAME,
  SITE_URL,
  X_URL,
} from '@/lib/site';
import { RATE_LIMIT } from '@/lib/agent/rate-limit-policy';

import { PAGE_MARKDOWN as DISCOVERY_SPEC_MARKDOWN } from '@/app/(app)/(home)/integration-spec/_content/markdown';
import { PAGE_MARKDOWN as DISCOVERY_ARCHITECTURE_MARKDOWN } from '@/app/(app)/(home)/discovery/architecture/_content/markdown';

/**
 * Markdown representations of site pages, served via `Accept: text/markdown`
 * content negotiation (see `src/proxy.ts` and `/md/[[...slug]]`) and used as
 * the source for the server-rendered trust/docs pages (`/docs`, `/about`,
 * `/contact`, `/pricing`).
 *
 * Every body is plain CommonMark with absolute links so it reads correctly
 * when detached from the site.
 */

export interface MarkdownPage {
  path: string;
  title: string;
  description: string;
  body: () => Promise<string> | string;
}

const u = (path: string) => `${SITE_URL}${path}`;

// ── Shared fragments ─────────────────────────────────

export const WHEN_TO_USE = `## When to use x402scan

Reach for x402scan when you need to:

- **Find a paid API an agent can call right now.** Search the registry of x402-protected resources by capability (\`GET ${API_BASE_PATH}/resources/search?q=…\`) and get back the URL, HTTP method, price in USDC, network, and input schema for each match.
- **Check what a service costs before calling it.** Every indexed resource carries its 402 payment requirements (\`maxAmountRequired\`, \`payTo\`, \`network\`), so you can budget a call without probing the endpoint yourself.
- **Look up on-chain x402 activity.** Who is buying, who is selling, how much USDC moved, on which chain, through which facilitator — per wallet, per merchant, or ecosystem-wide, over 1/7/14/30-day windows.
- **Verify a merchant or wallet.** Pull transaction history and aggregate stats for any Base or Solana address that has sent or received x402 payments.
- **Register your own x402 endpoints** so other agents can discover and pay for them (\`POST ${API_BASE_PATH}/registry/register-origin\`).
- **Pay for any x402 API without writing payment code.** The \`@x402scan/mcp\` server / CLI handles the 402 → pay → retry loop for you.

x402scan is *not* the right tool for general blockchain exploration (use a block explorer), for non-x402 APIs, or for fiat/card payments.

## How an agent should call x402scan

1. Read the OpenAPI spec at ${u('/openapi.json')} (15 operations, typed request and response schemas).
2. Read endpoints cost $0.01–$0.02 USDC per call via the x402 protocol: send the request, receive \`402 Payment Required\` with a \`PAYMENT-REQUIRED\` header, sign the payment, and retry with an \`X-Payment\` header. Any x402 client does this automatically — e.g. \`npx @x402scan/mcp fetch <url>\`.
3. Registry writes are free but need a wallet signature (SIWX, header \`SIGN-IN-WITH-X\`).
4. Errors are JSON (\`{ "success": false, "error": … }\`) with a stable \`type\` code; rate limits are advertised with \`RateLimit\` / \`RateLimit-Policy\` headers.
`;

const FOOTER_LINKS = `## More

- Docs: ${u('/docs')} · OpenAPI: ${u('/openapi.json')} · llms.txt: ${u('/llms.txt')}
- Sitemap: ${u('/sitemap.xml')} · API catalog: ${u('/.well-known/api-catalog')} · MCP: ${u('/.well-known/mcp.json')}
- Source: ${REPO_URL}
`;

// ── Page bodies ──────────────────────────────────────

const HOME = `# ${SITE_NAME}

> ${SITE_NAME} is the block explorer, analytics dashboard, and marketplace for x402 — the open standard for internet-native payments where agents buy API access just-in-time with USDC over HTTP 402.

x402scan indexes x402 servers, resources, payments, buyers, merchants, and facilitators across Base and Solana, and exposes all of it through a public REST API, an OpenAPI spec, and an MCP server so both humans and AI agents can use it.

${WHEN_TO_USE}
## Explore

- [Discover](${u('/')}) — featured x402 services, live transaction volume, top buyers and merchants
- [All activity](${u('/all')}) — every indexed server, facilitator, buyer and seller
- [Marketplace](${u('/resources')}) — browse and search paid API resources
- [Facilitators](${u('/facilitators')}) — services that verify and settle x402 payments
- [Networks](${u('/networks')}) — activity broken down by chain (Base, Solana)
- [What is x402](${u('/x402')}) · [Agentic commerce](${u('/agentic-commerce')})

## Build

- [API documentation](${u('/docs')}) — authentication, endpoints, errors, rate limits, versioning
- [Register your API](${u('/resources/register')}) · [Sell to agents](${u('/discovery')})
- [MCP server & CLI](${u('/mcp')}) — \`npx @x402scan/mcp\`
- [Pricing](${u('/pricing')}) · [About](${u('/about')}) · [Contact](${u('/contact')})

${FOOTER_LINKS}`;

function endpointTable(): string {
  const rows = API_ENDPOINTS.map(
    e =>
      `| \`${e.method} ${e.path}\` | ${e.summary} | ${describeAuth(e.auth)} |`
  );
  return [
    '| Endpoint | Purpose | Auth / price |',
    '| --- | --- | --- |',
    ...rows,
  ].join('\n');
}

function endpointDetails(): string {
  return API_ENDPOINTS.map(
    e => `### \`${e.method} ${e.path}\`

${e.description}

- **Auth:** ${describeAuth(e.auth)}
- **operationId:** \`${e.operationId}\`
${e.pathParams ? e.pathParams.map(p => `- **Path param \`${p.name}\`:** ${p.description}`).join('\n') + '\n' : ''}- **Example:** \`${e.method} ${u(e.example)}\``
  ).join('\n\n');
}

const DOCS = () => `# ${SITE_NAME} API documentation

> The ${SITE_NAME} public REST API (\`${API_BASE_PATH}\`) gives agents and developers programmatic access to indexed x402 payment data and the x402 resource registry. Machine-readable spec: ${u('/openapi.json')}.

**Base URL:** \`${SITE_URL}${API_BASE_PATH}\`
**OpenAPI 3.1:** ${u('/openapi.json')} · **API catalog (RFC 9727):** ${u('/.well-known/api-catalog')} · **Health:** ${u('/api/health')}

${WHEN_TO_USE}
## Authentication and payment

There are no API keys and no accounts. Two mechanisms are used:

### x402 micropayments (read endpoints)

Data endpoints cost **$0.01–$0.02 USDC per request**, paid on Base (\`eip155:8453\`) or Solana. The flow is the standard x402 handshake:

1. Call the endpoint. You receive \`402 Payment Required\` with a base64 \`PAYMENT-REQUIRED\` header (and JSON body) describing the accepted payment: amount, asset (USDC), \`payTo\` address, network, and timeout.
2. Sign a payment authorization for that amount with your wallet.
3. Retry the same request with the signed payload in the \`X-Payment\` header. The response is the data you asked for.

Any x402-aware client does this for you. The quickest options:

\`\`\`bash
# one-off call from a shell (creates a local wallet on first run)
npx @x402scan/mcp fetch "${SITE_URL}${API_BASE_PATH}/resources/search?q=weather"

# inspect price and schema without paying
npx @x402scan/mcp check "${SITE_URL}${API_BASE_PATH}/merchants"
\`\`\`

### SIWX wallet sign-in (registry writes)

\`POST ${API_BASE_PATH}/registry/register\` and \`POST ${API_BASE_PATH}/registry/register-origin\` are free but require a Sign-In-With-X (SIWE / SIWS) signature in the \`SIGN-IN-WITH-X\` header to prove wallet ownership. Calling them without the header returns \`402\` with a challenge to sign. The MCP server exposes this as \`fetch_with_auth\`.

## Endpoints

${endpointTable()}

All list endpoints accept \`page\` (0-based, default 0) and \`page_size\` (1–100, default 10) and return:

\`\`\`json
{ "data": [ … ], "pagination": { "page": 0, "page_size": 10, "has_next_page": true } }
\`\`\`

Common filters: \`chain\` (\`base\` | \`solana\`), \`timeframe\` in days (\`1\`, \`7\`, \`14\`, \`30\`; omit for all time). Amounts are USDC in whole units (not base units) unless a field is explicitly named \`maxAmountRequired\` in a 402 payload, which follows the x402 spec.

${endpointDetails()}

## Errors

Every error is JSON — never an HTML page — with this shape:

\`\`\`json
{
  "success": false,
  "error": {
    "type": "not_found",
    "message": "No discovery document found at https://example.com",
    "hint": "Publish /openapi.json or /.well-known/x402 on the origin, then retry."
  }
}
\`\`\`

\`error\` may also be a plain string for validation failures raised by the framework (\`{ "success": false, "error": "Validation failed" }\`). The schema is published as \`components.schemas.Error\` in the OpenAPI spec.

| Status | Meaning | \`error.type\` values |
| --- | --- | --- |
| \`400\` | Malformed input — invalid address, bad query parameter | \`validation_error\`, \`invalid_address\` |
| \`402\` | Payment or wallet signature required (x402 / SIWX challenge) | — (see \`PAYMENT-REQUIRED\` header) |
| \`404\` | Unknown route, or no discovery document on the origin you asked to register | \`not_found\`, \`no_discovery\` |
| \`405\` | Method not allowed for this route | \`method_not_allowed\` |
| \`422\` | The request was understood but can't be fulfilled (endpoint not in the origin's spec, no valid paid resources) | \`not_in_spec\`, \`no_valid_resources\`, \`registration_failed\` |
| \`429\` | Rate limited — wait \`Retry-After\` seconds | \`rate_limited\` |
| \`500\` | Unexpected server error | \`internal_error\` |

Unknown \`/api/*\` paths return a JSON \`404\` that links to this page and the OpenAPI spec so a misrouted agent can recover.

## Rate limits

Requests to \`${API_BASE_PATH}/*\` are limited per client IP to **${RATE_LIMIT.limit} requests per ${RATE_LIMIT.windowSeconds} seconds**. Every response carries the IETF RateLimit headers (draft-ietf-httpapi-ratelimit-headers) plus the widely supported \`X-RateLimit-*\` aliases:

\`\`\`http
RateLimit-Policy: "${RATE_LIMIT.policyName}";q=${RATE_LIMIT.limit};w=${RATE_LIMIT.windowSeconds}
RateLimit: "${RATE_LIMIT.policyName}";r=${RATE_LIMIT.limit - 1};t=${RATE_LIMIT.windowSeconds}
X-RateLimit-Limit: ${RATE_LIMIT.limit}
X-RateLimit-Remaining: ${RATE_LIMIT.limit - 1}
X-RateLimit-Reset: ${RATE_LIMIT.windowSeconds}
\`\`\`

When the limit is exceeded you get \`429 Too Many Requests\` with a \`Retry-After\` header (seconds) and a JSON error of type \`rate_limited\`. Self-throttle from the \`r=\` (remaining) and \`t=\` (seconds until reset) values rather than retrying blindly.

## Versioning and deprecation

- The API is **version ${API_VERSION}**, identified by the stable \`${API_BASE_PATH}\` path prefix. Every response also carries \`${API_VERSION_HEADER}: ${API_VERSION}\`.
- Within a version we only make **additive** changes: new endpoints, new optional parameters, new response fields. Existing fields are never renamed or removed and their types never change.
- Breaking changes ship under a new prefix (\`/api/x402/v2\`) and the previous version keeps working for **at least 90 days**.
- A deprecated endpoint announces itself with the standard \`Deprecation: @<unix-timestamp>\` (RFC 9745) and \`Sunset: <HTTP-date>\` (RFC 8594) response headers, plus \`deprecated: true\` on the operation in the OpenAPI spec. The changelog lives in the repository releases: ${REPO_URL}/releases.

## Machine-readable discovery

| Resource | URL |
| --- | --- |
| OpenAPI 3.1 spec | ${u('/openapi.json')} |
| RFC 9727 API catalog | ${u('/.well-known/api-catalog')} |
| llms.txt | ${u('/llms.txt')} |
| MCP server manifest | ${u('/.well-known/mcp.json')} |
| Sitemap | ${u('/sitemap.xml')} |
| Health | ${u('/api/health')} |

Every HTML page on the site also has a Markdown representation: request it with \`Accept: text/markdown\` (responses set \`Vary: Accept\`).

## MCP server and CLI

\`@x402scan/mcp\` (${NPM_MCP_URL}) is both a Model Context Protocol server and a command-line tool for calling x402-protected APIs with automatic payment handling. Tools: \`fetch\`, \`fetch_with_auth\`, \`check_endpoint_schema\`, \`discover_api_endpoints\`, \`get_wallet_info\`, \`redeem_invite\`, \`report_error\`.

\`\`\`bash
npx @x402scan/mcp install            # guided install into Claude Code / Cursor / Codex / Claude Desktop
npx @x402scan/mcp fetch <url>        # HTTP fetch with automatic x402 payment
npx @x402scan/mcp check <url>        # show an endpoint's price and schema, no payment
npx @x402scan/mcp discover <origin>  # list x402 endpoints exposed by an origin
npx @x402scan/mcp wallet info        # wallet address, balance, deposit link
\`\`\`

See ${u('/mcp')} and ${u('/mcp/guide')} for setup details.

## Registering your own API

Follow the [discovery spec](${u('/discovery/spec')}) (Markdown: ${u('/discovery/spec.md')}) — publish an \`openapi.json\` with your x402 endpoints, then call \`POST ${API_BASE_PATH}/registry/register-origin\` or use the form at ${u('/resources/register')}.

${FOOTER_LINKS}`;

const ABOUT = `# About ${SITE_NAME}

> ${SITE_NAME} is the ecosystem explorer, analytics dashboard, and marketplace for x402, the open HTTP-native payment standard that lets software — especially AI agents — pay for API access per request with USDC.

## What we do

x402 turns the long-dormant \`402 Payment Required\` status code into a real payment rail: a client asks for a resource, the server replies with what it costs, the client pays with a stablecoin, and the request goes through. No accounts, no API keys, no subscriptions. It is the natural way for autonomous agents to buy the data and tools they need.

x402scan makes that economy observable and navigable. We index every x402 payment settled through known facilitators on Base and Solana, resolve the servers and resources behind them, and publish:

- **An explorer** of transactions, buyers, merchants, facilitators, and networks, updated continuously.
- **A marketplace** of x402-protected APIs with prices, schemas, and usage statistics, so agents can find a service by capability and know what it costs before calling it.
- **A registry** where API providers publish their endpoints and become discoverable to agents (see [Sell to agents](${u('/discovery')})).
- **A public API** (${u('/docs')}) and an **MCP server** (${u('/mcp')}) so the same data is available to programs, not just people.

## Who builds it

x402scan is built and operated by [${ORG.name}](${ORG.url}), a New York–based software company building infrastructure for agentic commerce. The project is open source (Apache 2.0) at ${REPO_URL}; contributions and issues are welcome there.

## Principles

- **Agent-first.** Everything on the site has a machine-readable counterpart: an OpenAPI spec, an llms.txt, Markdown content negotiation, JSON errors, and typed schemas.
- **Pay-per-use, no lock-in.** Our own API uses x402: fractions of a cent per call, no sign-up.
- **Open data.** The underlying payments are public on-chain; we add structure and context, and the code that does so is public.

## Contact

See ${u('/contact')}. Company mailing address: ${ORG.address.streetAddress}, ${ORG.address.addressLocality}, ${ORG.address.addressRegion} ${ORG.address.postalCode}, USA.

${FOOTER_LINKS}`;

const CONTACT = `# Contact ${SITE_NAME}

> How to reach the ${SITE_NAME} team at ${ORG.name} for support, partnerships, legal and privacy requests.

## Channels

| Purpose | Where |
| --- | --- |
| Bugs, feature requests, questions about the data or the API | GitHub issues: ${REPO_URL}/issues |
| Registering or correcting a listed API / merchant | Use ${u('/resources/register')} or open a GitHub issue |
| Partnerships, facilitator and ecosystem inquiries | Email [${ORG.email}](mailto:${ORG.email}) |
| Privacy requests (access, deletion, GDPR/CCPA) | Email [${ORG.privacyEmail}](mailto:${ORG.privacyEmail}) — see the [Privacy Policy](${u('/privacy')}) |
| Copyright / DMCA notices | Email [copyright@merit.systems](mailto:copyright@merit.systems) — see the [Terms of Service](${u('/tos')}) |
| Updates and announcements | X / Twitter: ${X_URL} |

## Company

**${ORG.legalName}**
${ORG.address.streetAddress}
${ORG.address.addressLocality}, ${ORG.address.addressRegion} ${ORG.address.postalCode}, USA
${ORG.url}

## For agents

Before emailing, check whether the answer is already machine-readable:

- API docs: ${u('/docs')} · OpenAPI: ${u('/openapi.json')}
- Pricing: ${u('/pricing')}
- Health / status: ${u('/api/health')}

Critical bugs in the MCP server or CLI can be reported directly with \`npx @x402scan/mcp report-error\`.

${FOOTER_LINKS}`;

const PRICING = `# ${SITE_NAME} pricing

> Browsing x402scan is free. The public API is pay-per-request with USDC via x402 — $0.01 to $0.02 per call, no subscription, no API key, no minimum.

## Website

Everything at ${SITE_URL} — the explorer, marketplace, facilitator and network dashboards, and registering your own API — is **free** for humans and crawlers alike.

## Public API (\`${API_BASE_PATH}\`)

| Plan | Price | Includes |
| --- | --- | --- |
| Pay-per-request (default) | **$0.01 USDC** per read request | All data endpoints: buyers, merchants, wallets, facilitators, resources, origin lookups |
| Search | **$0.02 USDC** per request | \`GET ${API_BASE_PATH}/resources/search\` full-text search |
| Registry writes | **Free** | \`POST ${API_BASE_PATH}/registry/register\`, \`POST ${API_BASE_PATH}/registry/register-origin\` (SIWX wallet signature required) |
| Send USDC | **Amount sent** (no fee from x402scan) | \`POST ${API_BASE_PATH}/send\`, up to 1000 USDC per call |

Payments are settled on Base (\`eip155:8453\`) or Solana in USDC through the x402 protocol. There are no accounts, invoices, or monthly tiers: each request carries its own payment. Network fees are covered by the facilitator for the supported "exact" scheme, so the listed price is the total price.

Rate limit: ${RATE_LIMIT.limit} requests per ${RATE_LIMIT.windowSeconds} seconds per client IP (see ${u('/docs')}#rate-limits).

## MCP server and CLI

\`@x402scan/mcp\` is **free and open source** (MIT). You pay only the x402 prices of the APIs you call through it, which are shown by \`npx @x402scan/mcp check <url>\` before any payment is made.

## Listing your API

Registering an x402 API in the marketplace is **free**. x402scan takes no cut of payments made to your endpoints — buyers pay you directly on-chain.

## Questions

Pricing is also published as schema.org \`Offer\` data in the homepage JSON-LD. For anything else, see ${u('/contact')}.

${FOOTER_LINKS}`;

const X402 = `# What is x402?

> x402 is an HTTP-native payments standard that lets clients and servers complete payments through the existing \`402 Payment Required\` flow.

## How x402 works

1. A client requests a paid resource.
2. The server responds with \`402 Payment Required\` and a \`PAYMENT-REQUIRED\` header describing the accepted payment (amount, USDC asset, \`payTo\` address, network, timeout).
3. The client signs a payment authorization with its wallet and retries the request with an \`X-Payment\` header.
4. A facilitator verifies and settles the payment on-chain; the server returns the resource.

## Why x402 matters

Paid APIs usually require accounts, checkout, prepaid credits, and API keys before software can do anything useful. x402 lets services support pay-per-request access without manual account setup, prepaid subscriptions, or long-lived API keys — which is exactly what autonomous AI agents need.

## Explore x402 on x402scan

- Live volume, buyers, and merchants: ${u('/')}
- Marketplace of paid APIs: ${u('/resources')}
- Facilitators: ${u('/facilitators')} · Networks: ${u('/networks')}

## Build with x402

- Call x402 APIs with automatic payment: ${u('/mcp')} (\`npx @x402scan/mcp fetch <url>\`)
- Sell to agents / register your API: ${u('/discovery')}
- x402scan public API: ${u('/docs')}

${FOOTER_LINKS}`;

const AGENTIC_COMMERCE = `# Agentic commerce

> Agentic commerce is software — AI agents — buying goods, data, and services on behalf of people, autonomously and at machine speed. x402 is the payment rail that makes this work over plain HTTP.

## What is agentic commerce?

Agents increasingly do the work that used to require a person clicking through a website: finding an API, evaluating it, paying for it, and using the result. Ad-supported and subscription models break down when the "user" is a program, so providers charge per request instead — fractions of a cent, paid in stablecoins, settled on-chain.

## How providers sell to agents

1. Expose an endpoint that returns \`402 Payment Required\` with an x402 payment requirement.
2. Publish an \`openapi.json\` (or \`/.well-known/x402\`) describing the endpoint so agents can discover it.
3. Register the origin on x402scan so it appears in the marketplace and in agent search results.

Step-by-step: ${u('/discovery')} · spec: ${u('/discovery/spec')}

## The x402scan role

x402scan is the directory and the ledger of this market: it indexes every x402 payment, catalogs the services being sold, and exposes both through a public API and an MCP server so agents can find services, check prices, and verify merchants programmatically.

## Enter the agent market

- Register your API: ${u('/resources/register')}
- Browse what agents are buying: ${u('/resources')}

${FOOTER_LINKS}`;

const MCP = `# x402scan MCP server and CLI

> \`@x402scan/mcp\` is a Model Context Protocol server and command-line tool that lets AI agents call any x402-protected API with automatic USDC payment handling. Package: ${NPM_MCP_URL} · Source: ${REPO_URL}/tree/main/packages/external/mcp

## Install

\`\`\`bash
npx @x402scan/mcp install               # guided install for Claude Code, Cursor, Codex, Claude Desktop
claude mcp add x402scan -- npx -y @x402scan/mcp   # Claude Code, one-liner
\`\`\`

The server runs over stdio. A manifest describing it is published at ${u('/.well-known/mcp.json')}.

## MCP tools

| Tool | What it does |
| --- | --- |
| \`fetch\` | HTTP request to any URL; if it answers \`402\`, pays with the agent's wallet and retries |
| \`fetch_with_auth\` | Same, plus SIWX wallet sign-in for identity-gated endpoints |
| \`check_endpoint_schema\` | Returns an endpoint's price, schema and auth mode without paying |
| \`discover_api_endpoints\` | Lists x402 endpoints exposed by an origin (openapi.json / .well-known/x402) |
| \`get_wallet_info\` / \`redeem_invite\` | Wallet address, USDC balance, funding link, invite-code redemption |
| \`report_error\` | Report a critical bug to the x402scan team |

To search the marketplace by capability, \`fetch\` \`${u(`${API_BASE_PATH}/resources/search?q=<query>`)}\` ($0.02).

## CLI

Every tool is also a shell command, so scripts and non-MCP agents can use it:

\`\`\`bash
npx @x402scan/mcp fetch "https://api.example.com/paid" -m POST -b '{"q":"…"}'
npx @x402scan/mcp check "https://api.example.com/paid"
npx @x402scan/mcp discover "https://api.example.com"
npx @x402scan/mcp wallet info
npx @x402scan/mcp fund
\`\`\`

Output is JSON when piped and pretty-printed on a TTY (\`--format json|pretty\`). Prices are shown before any payment is made.

## Wallet and funding

On first run the CLI creates a local wallet. Fund it with USDC on Base at ${u('/mcp/deposit')} or via \`npx @x402scan/mcp fund\`. Invite codes (\`wallet redeem <code>\`) grant starter balances.

## Guide

Full walkthrough: ${u('/mcp/guide')}

${FOOTER_LINKS}`;

const MCP_GUIDE = `# Using the x402scan MCP server

> A practical guide to calling paid x402 APIs from an AI agent with \`@x402scan/mcp\`.

## 1. Install

\`npx @x402scan/mcp install\` detects your client (Claude Code, Cursor, Codex, Claude Desktop) and writes the MCP configuration. Manual config:

\`\`\`json
{ "mcpServers": { "x402scan": { "command": "npx", "args": ["-y", "@x402scan/mcp"] } } }
\`\`\`

## 2. Fund the wallet

Run \`npx @x402scan/mcp wallet info\` to get the wallet address and a deposit link, then send USDC on Base. Most x402 calls cost $0.001–$0.05, so a few dollars lasts a long time.

## 3. Find an API

Ask the agent to \`fetch\` \`${u(`${API_BASE_PATH}/resources/search?q=<capability>`)}\` — it returns matching URLs, prices, and schemas from the x402scan marketplace (${u('/resources')}). Or call \`discover_api_endpoints\` for a server you already know.

## 4. Check, then call

\`check_endpoint_schema\` shows the price and schema without paying. \`fetch\` performs the request, pays the \`402\` challenge automatically, and returns the response body.

## 5. Identity-gated endpoints

Some services require proof of wallet ownership instead of (or in addition to) payment. \`fetch_with_auth\` signs a SIWX challenge with the same wallet.

## Troubleshooting

- \`402\` still returned after payment → the wallet balance is too low; run \`fund\`.
- Endpoint not found by \`discover\` → the origin has no \`openapi.json\` / \`/.well-known/x402\`; see ${u('/discovery')}.
- Critical bug → \`npx @x402scan/mcp report-error\`.

${FOOTER_LINKS}`;

const DISCOVERY = `# Sell to agents

> Start onboarding agents as customers with x402 payments: publish a discoverable, pay-per-request API and register it on x402scan.

## Why

AI agents are becoming the primary way people interact with the internet. As activity flows through agent interfaces instead of browsers, ad-based models break — there are no human eyeballs to monetize. Pay-per-request pricing at fractions of a cent opens your service to a new audience that subscription tiers never reach.

## Steps

1. **Quickstart** — add x402 payment gating to an endpoint: ${u('/discovery/quickstart')}
2. **Become discoverable** — publish an \`openapi.json\` that follows the discovery spec: ${u('/discovery/spec')} (Markdown: ${u('/discovery/spec.md')})
3. **Register** — ${u('/resources/register')} or \`POST ${API_BASE_PATH}/registry/register-origin\`
4. **Understand the pipeline** — how x402scan crawls, validates, and lists your resources: ${u('/discovery/architecture')} (Markdown: ${u('/discovery/architecture.md')})

${FOOTER_LINKS}`;

const RESOURCES = `# x402 marketplace

> Browse and search every x402-protected API resource indexed by x402scan, with prices, schemas, and usage stats.

The marketplace UI at ${u('/resources')} is a client-side table. Agents should use the API instead:

- Search by capability: \`GET ${API_BASE_PATH}/resources/search?q=<query>\` ($0.02)
- List all resources: \`GET ${API_BASE_PATH}/resources?page_size=50\` ($0.01)
- Resources for one server: \`GET ${API_BASE_PATH}/origins/{id}/resources\` ($0.01)

Each resource record includes the URL and method, \`accepts\` (price in USDC, \`payTo\`, network, scheme), origin title/description, tags, and the 402 response captured at registration.

Register your own: ${u('/resources/register')}

${FOOTER_LINKS}`;

const REGISTER = `# Register an x402 API

> Add your x402-compatible API to x402scan so agents and developers can discover what it does, what it costs, and how to call it. Listing is free.

## Requirements

1. At least one endpoint that returns \`402 Payment Required\` with an x402 payment requirement.
2. An \`openapi.json\` at your origin (or \`/.well-known/x402\`) that lists those endpoints — see ${u('/discovery/spec')}. Add \`info.contact.email\` to verify ownership.

## Register via API

\`\`\`bash
# Registers every x402 endpoint found in https://api.example.com/openapi.json
curl -X POST ${SITE_URL}${API_BASE_PATH}/registry/register-origin \\
  -H 'Content-Type: application/json' \\
  -H 'SIGN-IN-WITH-X: <siwx signature>' \\
  -d '{"origin":"https://api.example.com"}'
\`\`\`

Or register one endpoint with \`POST ${API_BASE_PATH}/registry/register\` and \`{"url": "…"}\`. With the MCP server: \`fetch_with_auth\` handles the SIWX signature.

## Register in the browser

${u('/resources/register')} — paste your origin URL and sign with your wallet.

${FOOTER_LINKS}`;

const FACILITATORS = `# x402 facilitators

> Facilitators are the services that verify x402 payment authorizations and settle them on-chain on behalf of API servers. x402scan tracks each facilitator's transaction count, USDC volume, unique buyers and sellers, and supported chains.

Data: \`GET ${API_BASE_PATH}/facilitators\` (per facilitator) and \`GET ${API_BASE_PATH}/facilitators/stats\` (ecosystem totals), both $0.01. Human view: ${u('/facilitators')}; each facilitator has a detail page at \`/facilitator/{id}\`.

${FOOTER_LINKS}`;

const NETWORKS = `# x402 networks

> x402 activity broken down by blockchain. x402scan currently indexes USDC payments on **Base** (\`eip155:8453\`) and **Solana**.

Use the \`chain\` query parameter (\`base\` | \`solana\`) on any ${API_BASE_PATH} endpoint to scope results to one network, e.g. \`GET ${API_BASE_PATH}/facilitators/stats?chain=solana&timeframe=7\`. Human view: ${u('/networks')}.

${FOOTER_LINKS}`;

async function publicFile(name: string): Promise<string> {
  return readFile(join(process.cwd(), 'public', name), 'utf-8');
}

// ── Registry ─────────────────────────────────────────

export const MARKDOWN_PAGES: readonly MarkdownPage[] = [
  {
    path: '/',
    title: `${SITE_NAME} | x402 Ecosystem Explorer`,
    description:
      'Block explorer, analytics dashboard and marketplace for x402 paid APIs and agentic commerce.',
    body: () => HOME,
  },
  {
    path: '/docs',
    title: 'API documentation',
    description:
      'Authentication, endpoints, errors, rate limits, and versioning for the x402scan public API.',
    body: DOCS,
  },
  {
    path: '/about',
    title: 'About',
    description:
      'What x402scan is, who builds it, and why it exists: the explorer and marketplace for the x402 payment standard.',
    body: () => ABOUT,
  },
  {
    path: '/contact',
    title: 'Contact',
    description:
      'How to reach the x402scan team at Merit Systems for support, partnerships, privacy and legal requests.',
    body: () => CONTACT,
  },
  {
    path: '/pricing',
    title: 'Pricing',
    description:
      'x402scan is free to browse; the public API is pay-per-request via x402 at $0.01–$0.02 USDC per call.',
    body: () => PRICING,
  },
  {
    path: '/x402',
    title: 'What is x402?',
    description:
      'An HTTP-native payment standard for paid APIs and agentic commerce.',
    body: () => X402,
  },
  {
    path: '/agentic-commerce',
    title: 'Agentic commerce',
    description: 'How AI agents buy and sell APIs over x402.',
    body: () => AGENTIC_COMMERCE,
  },
  {
    path: '/mcp',
    title: 'MCP server and CLI',
    description:
      'Install the @x402scan/mcp server / CLI to call x402 APIs with automatic payment handling.',
    body: () => MCP,
  },
  {
    path: '/mcp/guide',
    title: 'MCP guide',
    description: 'Using the x402scan MCP server for agentic workflows.',
    body: () => MCP_GUIDE,
  },
  {
    path: '/discovery',
    title: 'Sell to agents',
    description: 'Start onboarding agents as customers with x402 payments.',
    body: () => DISCOVERY,
  },
  {
    path: '/discovery/spec',
    title: 'Discovery spec',
    description:
      'The integration and discovery contract for registering x402 resources.',
    body: () => DISCOVERY_SPEC_MARKDOWN,
  },
  {
    path: '/discovery/architecture',
    title: 'Discovery architecture',
    description: 'How x402scan discovery works end to end.',
    body: () => DISCOVERY_ARCHITECTURE_MARKDOWN,
  },
  {
    path: '/resources',
    title: 'Marketplace',
    description: 'Browse and search x402-protected API resources.',
    body: () => RESOURCES,
  },
  {
    path: '/resources/register',
    title: 'Register an API',
    description: 'Add your x402 API to the x402scan marketplace.',
    body: () => REGISTER,
  },
  {
    path: '/facilitators',
    title: 'Facilitators',
    description: 'x402 facilitators and their activity stats.',
    body: () => FACILITATORS,
  },
  {
    path: '/networks',
    title: 'Networks',
    description: 'x402 activity by chain: Base and Solana.',
    body: () => NETWORKS,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'How x402scan collects, uses, and protects information.',
    body: () => publicFile('privacy.md'),
  },
  {
    path: '/tos',
    title: 'Terms of Service',
    description: 'Terms governing use of x402scan.',
    body: () => publicFile('tos.md'),
  },
];

const pagesByPath = new Map(MARKDOWN_PAGES.map(page => [page.path, page]));

/** Normalise a request pathname: strip trailing slashes, keep `/` for root. */
export function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export function getMarkdownPage(pathname: string): MarkdownPage | undefined {
  return pagesByPath.get(normalizePath(pathname));
}

/** Markdown body for unknown paths: tells an agent where to look next. */
export function notFoundMarkdown(pathname: string): string {
  return `# 404 — Not found

There is no page at \`${normalizePath(pathname)}\` on ${SITE_NAME}.

## Where to look next

- Site map: ${u('/sitemap.xml')}
- Agent guide (llms.txt): ${u('/llms.txt')}
- API documentation: ${u('/docs')} · OpenAPI spec: ${u('/openapi.json')}
- Home: ${u('/')} · Marketplace: ${u('/resources')} · Facilitators: ${u('/facilitators')}

Dynamic pages follow these patterns: \`/server/{originId}\`, \`/facilitator/{id}\`, \`/recipient/{address}\`, \`/buyer/{address}\`. IDs and addresses come from the API (${u('/openapi.json')}).
`;
}
