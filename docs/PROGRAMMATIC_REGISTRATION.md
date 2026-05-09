# Programmatic Resource Registration

x402scan exposes public registry endpoints for resource providers that need to add or refresh listings without using the website form.

Registry writes require SIWX authentication and are free. The first request receives a SIWX challenge, then the client retries with a signed `SIGN-IN-WITH-X` header. The x402scan MCP `fetch_with_auth` tool automates that flow for EVM wallets.

## Register or Refresh One Resource

Use `POST /api/x402/registry/register` when you already know the exact x402-protected endpoint.

```http
POST /api/x402/registry/register HTTP/1.1
Host: www.x402scan.com
Content-Type: application/json
SIGN-IN-WITH-X: <signed-siwx-proof>

{
  "url": "https://api.example.com/paid-resource"
}
```

The endpoint probes the resource URL, validates the x402 challenge, and upserts the listing. Calling it again for the same URL refreshes the stored resource metadata, payment requirements, and last-updated timestamp.

Successful responses include the registered resource, accepted payment options, and registration details:

```json
{
  "success": true,
  "resource": {},
  "accepts": [],
  "registrationDetails": {}
}
```

If the URL does not return a valid x402 challenge, the endpoint returns `422` with a parseable error.

## Register or Refresh an Origin

Use `POST /api/x402/registry/register-origin` when your server publishes discovery metadata through OpenAPI or `/.well-known/x402`.

```http
POST /api/x402/registry/register-origin HTTP/1.1
Host: www.x402scan.com
Content-Type: application/json
SIGN-IN-WITH-X: <signed-siwx-proof>

{
  "origin": "https://api.example.com"
}
```

The endpoint discovers resources for the origin, registers valid x402 routes, skips SIWX-only routes, reports failures, and deprecates stale resources that are no longer present in discovery.

Example response shape:

```json
{
  "success": true,
  "registered": 2,
  "siwx": 1,
  "failed": 0,
  "skipped": 0,
  "deprecated": 0,
  "total": 3,
  "source": "openapi"
}
```

## Discovery Requirements

For reliable automatic registration, publish an OpenAPI document at `/openapi.json` with x402 payment metadata. `/.well-known/x402` is also supported for compatibility.

See the [Discovery Document Guide](./DISCOVERY.md) for accepted formats, validation commands, and common failure reasons.
