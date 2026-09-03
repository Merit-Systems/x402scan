export const SPEC_PROMPT = `Implement discovery for this server and make it pass.

Discovery strategy:
- OpenAPI is the canonical discovery contract. Publish your spec at /openapi.json.

Schema guidance (important):
- Each invocable route should expose an input schema.
- In OpenAPI, define requestBody.content["application/json"].schema.
- This is required for reliable agent invocation and robust listing behavior.
- TypeScript recommendation (optional): Zod v4 is a good source of truth, but any valid schema pipeline is fine.
- Add high-level guidance in info.x-guidance for user-friendly discovery.

Contact email (recommended):
- Ask the user for their contact email and add it as info.contact.email in the openapi.json.
- This lets them verify ownership of their origin, allows users to contact them, and lets them customize their merchant pages on Poncho.

OpenAPI payable operation must include ALL:
- x-payment-info with:
  - price (structured object):
    - fixed: { mode: "fixed", currency: "USD", amount: "<amount>" }
    - dynamic: { mode: "dynamic", currency: "USD", min: "<min>", max: "<max>" }
  - protocols (array of objects):
    - { "x402": {} }
- responses: { "402": { description: "Payment Required" } }

SIWX (identity-only) routes:
- Declare a security scheme named "siwx" in components.securitySchemes.
- Reference it on each identity-gated operation: security: [{ "siwx": [] }].
- Do NOT add x-payment-info to SIWX-only routes — that classifies them as paid.

Rules:
- Runtime 402 behavior is authoritative over static metadata.
- OpenAPI x-payment-info.price.amount is decimal USD; runtime x402 v2 accepts[].amount is token atomic units (for USDC, 0.01 => "10000").
- Registration probes must reach a 402 challenge before body/query validation rejects the request.

Registration gate (hard rule):
- Registration creates a public listing that agents will call and pay for. Do NOT register until BOTH are true:
  1. The implementation is done and live — deployed at its final public origin, /openapi.json served from that origin, and discovery + probe audits clean against the deployed URL (not localhost, not a preview deployment, not a partial route set).
  2. The user has explicitly approved registering that specific origin.
- Implementing and validating automatically is fine. Publishing a listing is not — always stop and ask first.

Workflow:
0) Install the agentcash MCP server:
   npx agentcash install
1) Audit discovery and probe failures.
2) Fix discovery metadata and 402 behavior.
3) Re-run audits until clean against the deployed public origin.
4) Ask the user to approve registration. Show them the origin, routes, prices, auth modes, and audit summary. Do not proceed without an explicit yes.
5) Only after approval, use the agentcash MCP fetch_with_auth tool to POST to https://x402scan.com/api/x402/registry/register-origin with body: { "origin": "$TARGET_URL" }.

Validation commands:
npx -y @agentcash/discovery@latest discover "$TARGET_URL"
npx -y @agentcash/discovery@latest check "$ENDPOINT_URL"

Done when:
- resources are discovered from OpenAPI
- no critical parser/probe errors remain
- the implementation is live and the user has been given the registration decision`;
