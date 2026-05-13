# Programmatic Resource Registration

This document describes the public API for registering and refreshing x402
resources without using the `/resources/register` UI.

The registry endpoints are free to call, but they require SIWX wallet
authentication. They are intended for resource providers and agents that need
to refresh x402scan after adding or changing paid resources.

## Authentication

Use a SIWX-capable client and send the wallet proof in the
`SIGN-IN-WITH-X` header. The endpoint does not require an `X-Payment` header.

If you are using agentcash tooling, call these endpoints with `fetch_with_auth`
so the wallet proof is generated and attached automatically.

## Single Resource

```text
POST /api/x402/registry/register
Content-Type: application/json
SIGN-IN-WITH-X: <wallet proof>
```

Request body:

```json
{
  "url": "https://example.com/api/paid-route"
}
```

Use this when you want to register or refresh one concrete x402 endpoint. The
URL must be public HTTP(S). Local, loopback, link-local, and private-network
URLs are rejected before probing.

Success response:

```json
{
  "success": true,
  "resource": {},
  "accepts": [],
  "registrationDetails": {},
  "methodUsed": "POST",
  "discovery": {
    "found": true,
    "source": "openapi",
    "otherResourceCount": 2,
    "origin": "https://example.com",
    "resources": [
      "https://example.com/api/other-route",
      "https://example.com/api/search"
    ]
  }
}
```

Failure responses use HTTP `422` for a reachable but non-registerable resource:

```json
{
  "success": false,
  "error": {
    "type": "no_402",
    "message": "Endpoint did not return a 402 payment challenge"
  }
}
```

```json
{
  "success": false,
  "error": {
    "type": "parse_error",
    "parseErrors": ["Missing input schema"]
  },
  "data": {}
}
```

```json
{
  "success": false,
  "error": {
    "type": "unsupported_url",
    "message": "Local and private network URLs are not supported"
  }
}
```

## Origin Discovery

```text
POST /api/x402/registry/register-origin
Content-Type: application/json
SIGN-IN-WITH-X: <wallet proof>
```

Request body:

```json
{
  "origin": "https://example.com"
}
```

Use this when your origin publishes `/openapi.json` or `/.well-known/x402` and
you want x402scan to discover and register all paid resources for that origin.

Success response:

```json
{
  "success": true,
  "registered": 3,
  "siwx": 1,
  "failed": 0,
  "skipped": 0,
  "deprecated": 1,
  "total": 4,
  "source": "openapi",
  "siwxDetails": [
    {
      "url": "https://example.com/api/me"
    }
  ]
}
```

If no discovery document can be resolved, the endpoint returns HTTP `404`:

```json
{
  "success": false,
  "error": {
    "type": "no_discovery",
    "message": "No discovery document found"
  }
}
```

If discovery succeeds but no paid x402 resource can be registered, the endpoint
returns HTTP `422` with the detailed registration result:

```json
{
  "success": false,
  "error": {
    "type": "no_valid_resources",
    "message": "No valid paid x402 resources were found for this origin. Add at least one paid x402 resource that passes validation to complete registration."
  },
  "result": {
    "registered": 0,
    "failed": 1,
    "skipped": 0,
    "siwx": 0,
    "total": 1,
    "failedDetails": [
      {
        "url": "https://example.com/api/paid-route",
        "error": "Missing input schema"
      }
    ]
  }
}
```

## Recommended Flow

1. Publish OpenAPI at `/openapi.json` or publish `/.well-known/x402`.
2. Validate discovery with `@agentcash/discovery`.
3. Call `POST /api/x402/registry/register-origin`.
4. If `failedDetails` or `skippedDetails` are returned, fix those endpoints and
   call the origin endpoint again.
5. For partial rollouts, call `POST /api/x402/registry/register` for one URL.

The single-resource endpoint shares the same probe and database registration
path as the internal resource registration flow. The origin endpoint shares the
same discovery fan-out path used by the UI.
