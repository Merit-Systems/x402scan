export const PAGE_MARKDOWN = `# Discovery Spec

Build once, register reliably, and keep your x402 resources discoverable.

## Why This Matters

If agents can't discover your API, they can't call it. Bulletproof discovery turns your endpoint from merely listed to reliably invocable.

When metadata and runtime \`402\` behavior agree, agents succeed on the first pass. You get fewer x402scan failures, less debugging churn, and more real agent traffic.

- Publish OpenAPI as the canonical machine-readable contract.
- Treat runtime \`402\` challenge behavior as the final source of truth.

## OpenAPI Requirements

x402scan resolves your OpenAPI document at \`/openapi.json\`. This is the canonical machine-readable contract — it gives agents the cleanest invocation surface and the best tooling compatibility.

- Top-level fields: \`openapi\`, \`info.title\`, \`info.version\`, \`paths\`.
- For paid operations: \`responses.402\` and \`x-payment-info\`.
- Set \`x-payment-info.price\` (fixed or dynamic) and \`x-payment-info.protocols\` (array of protocol objects).
- Use OpenAPI \`security\` + \`components.securitySchemes\` for auth declaration.
- For SIWX (identity-only) routes: declare a scheme named \`siwx\` and reference it in \`security\`. Do not add \`x-payment-info\`.
- Add high-level guidance in \`info.x-guidance\` for user-friendly discovery.

\`\`\`json
{
  "openapi": "3.1.0",
  "info": { "title": "My API", "version": "1.0.0" },
  "paths": {
    "/api/quote": {
      "post": {
        "responses": { "402": { "description": "Payment Required" } },
        "x-payment-info": {
          "price": { "mode": "fixed", "currency": "USD", "amount": "0.05" },
          "protocols": [{ "x402": {} }]
        }
      }
    }
  }
}
\`\`\`

## SIWX (Sign-In with X) Routes

SIWX routes are identity-gated — they require a wallet proof but no payment. Agents with an agentcash wallet can call these for free.

- Declare a security scheme named \`siwx\` in \`components.securitySchemes\`.
- Reference it on each identity-gated operation via \`security: [{ "siwx": [] }]\`.
- Do **not** add \`x-payment-info\` to SIWX-only routes — that would classify them as paid.

\`\`\`json
{
  "components": {
    "securitySchemes": {
      "siwx": {
        "type": "apiKey",
        "in": "header",
        "name": "SIGN-IN-WITH-X"
      }
    }
  },
  "paths": {
    "/api/me": {
      "get": {
        "summary": "Get current user profile",
        "security": [{ "siwx": [] }],
        "responses": { "200": { "description": "OK" } }
      }
    }
  }
}
\`\`\`

The scheme **must** be named \`siwx\` — discovery resolves it by name. Routes with both \`x-payment-info\` and \`siwx\` security are classified as paid, not SIWX.

## Endpoint-Only Fallback

If no OpenAPI document exists, a single endpoint URL can still be registered. x402scan probes the URL directly via \`checkEndpointSchema\` from \`@agentcash/discovery\`.

- The probe is method-aware. It tries POST first, then GET, PUT, PATCH, DELETE, and picks the first response with a valid x402 payment option.
- The endpoint must return a parseable \`402\` challenge with at least one x402 entry in \`accepts\`.
- Endpoints without an input schema are non-invocable and are skipped during registration.
- SIWX endpoints are registered as identity-only.

\`\`\`
curl -i -X POST https://yourdomain.com/api/route
curl -i -X GET https://yourdomain.com/api/route
\`\`\`

## Common Failure Reasons

| Error | Likely Cause | Fix |
|---|---|---|
| Expected 402, got 404/405 | Wrong method or wrong path | Match method/path to your actual handler |
| Accepts must contain at least one valid payment requirement | Malformed or empty payment requirements | Return a valid non-empty x402 accepts set |
| Missing input schema | Strict parser cannot infer invocable contract | Publish Bazaar/OpenAPI input schema metadata |
| Expected 402, got 429 | Provider-side throttling | Retry, reduce probe volume, or register URL-only |
`;
