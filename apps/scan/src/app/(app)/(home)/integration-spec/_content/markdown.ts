export const PAGE_MARKDOWN = `# Become Discoverable

Build once, register reliably, and keep your resources discoverable by agents.

## Why This Matters

If agents can't discover your API, they can't call it. Bulletproof discovery turns your endpoint from merely listed to reliably invocable.

When metadata and runtime \`402\` behavior agree, agents succeed on the first pass. You get fewer failures, less debugging churn, and more real agent traffic.

- Publish OpenAPI as the canonical machine-readable contract.
- Treat runtime \`402\` challenge behavior as the final source of truth.

## Discovery Strategy

OpenAPI is the canonical discovery format. Use it for the cleanest machine-readable contract and best agent compatibility.

Expected location: \`GET /openapi.json\`

Requirements:

- Top-level fields: \`openapi\`, \`info.title\`, \`info.x-guidance\`, \`info.version\`, \`paths\`.
- For paid operations: \`responses.402\` and \`x-payment-info\`.
- Set \`x-payment-info.protocols\` (array of protocol objects) and one pricing mode (\`fixed\` or \`dynamic\`) with \`currency\`.
- Use OpenAPI \`security\` + \`components.securitySchemes\` for auth declaration.
- Add high-level guidance in \`info.x-guidance\` for agent-friendly discovery.

### Pricing modes in x-payment-info

- Fixed: \`{ price: { mode: "fixed", currency: "USD", amount: "<amount>" } }\`
- Dynamic: \`{ price: { mode: "dynamic", currency: "USD", min: "<min>", max: "<max>" } }\`

### Minimal valid example

\`\`\`json
{
  "openapi": "3.1.0",
  "info": {
    "title": "My API",
    "version": "1.0.0",
    "description": "example demo server",
    "x-guidance": "Use POST /api/search for neural web search. Accepts a JSON body with a 'query' field."
  },
  "paths": {
    "/api/search": {
      "post": {
        "operationId": "search",
        "summary": "Search - Neural search across the web",
        "tags": ["Search"],
        "x-payment-info": {
          "price": { "mode": "fixed", "currency": "USD", "amount": "0.010000" },
          "protocols": [{ "x402": {} }]
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "query": { "type": "string", "minLength": 1, "description": "The query string for the search" }
                },
                "required": ["query"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "results": { "type": "array", "items": { "type": "object" } }
                  },
                  "required": ["results"]
                }
              }
            }
          },
          "402": { "description": "Payment Required" }
        }
      }
    }
  }
}
\`\`\`

## Discovery Precedence

| Order | Source | Expected Location |
|---|---|---|
| 1 | OpenAPI document | \`/openapi.json\` |
| 2 | 402 API Response | Correct 402 header response |

## SIWX (Sign-In with X) Routes

SIWX routes are identity-gated — they require a wallet proof but no payment. Agents with a wallet can call these for free.

- Declare a security scheme named \`siwx\` in \`components.securitySchemes\`.
- Reference it on each identity-gated operation via \`security: [{ "siwx": [] }]\`.
- Do **not** add \`x-payment-info\` to SIWX-only routes — that would classify them as paid.

The scheme **must** be named \`siwx\` — discovery resolves it by name. Routes with both \`x-payment-info\` and \`siwx\` security are classified as paid, not SIWX.

## Common Failure Reasons

| Error | Likely Cause | Fix |
|---|---|---|
| Not Found | OpenAPI not found at {origin}/openapi.json | Add an OpenAPI document at {origin}/openapi.json |
| Input/Output Schema Missing | Operation has no input or output schema | Add an input and output schema to the operation |
| No Payment Modes Detected | No payment modes detected in the response | Add a valid payment mode to the response (x402) |
`;
