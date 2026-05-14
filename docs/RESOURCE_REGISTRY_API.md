# x402scan Resource Registry API

Resource providers can register or refresh x402 resources without using the
website form. The registry API uses the same backend registration flow as the
manual page and is intended for release scripts, CI jobs, and provider
dashboards.

Use the production base URL:

```text
https://www.x402scan.com
```

The API is also included in the generated OpenAPI document:

```text
GET https://www.x402scan.com/openapi.json
```

## Authentication

Registry write endpoints require Sign-In With X (SIWX) wallet authentication.
Send SIWX auth headers with the request. If you use the x402 tooling, call
these endpoints with `fetch_with_auth`.

Required headers for write endpoints:

```http
Content-Type: application/json
SIGN-IN-WITH-X: <siwx proof>
```

The endpoints are free to call. x402 payment headers are not required for
registration writes.

## Register or Refresh a Single Resource

Register one x402-protected endpoint by URL:

```http
POST /api/x402/registry/register
```

Request body:

```json
{
  "url": "https://api.example.com/paid/tool"
}
```

Example:

```bash
curl -X POST 'https://www.x402scan.com/api/x402/registry/register' \
  -H 'Content-Type: application/json' \
  -H 'SIGN-IN-WITH-X: <siwx proof>' \
  --data '{"url":"https://api.example.com/paid/tool"}'
```

Calling this endpoint again refreshes the existing registry entry. x402scan
probes the URL, parses the current 402 challenge, updates resource metadata,
updates accepted payment requirements, and refreshes origin metadata.

Successful response:

```json
{
  "success": true,
  "resource": {
    "resource": "https://api.example.com/paid/tool"
  },
  "accepts": [],
  "registrationDetails": {
    "originMetadata": {
      "title": "Example API"
    }
  }
}
```

Validation failure:

```json
{
  "success": false,
  "error": {
    "type": "no_402",
    "message": "Endpoint did not return a 402 payment challenge"
  }
}
```

## Register or Refresh an Origin

Discover and register all x402 resources exposed by an origin:

```http
POST /api/x402/registry/register-origin
```

Request body:

```json
{
  "origin": "https://api.example.com"
}
```

Example:

```bash
curl -X POST 'https://www.x402scan.com/api/x402/registry/register-origin' \
  -H 'Content-Type: application/json' \
  -H 'SIGN-IN-WITH-X: <siwx proof>' \
  --data '{"origin":"https://api.example.com"}'
```

x402scan discovers resources from the origin by checking OpenAPI first and then
`/.well-known/x402`. Valid paid resources are registered or refreshed. Resources
from the same origin that disappear from discovery are deprecated.

Successful response:

```json
{
  "success": true,
  "registered": 2,
  "siwx": 0,
  "failed": 0,
  "skipped": 0,
  "deprecated": 0,
  "total": 2,
  "source": "https://api.example.com/openapi.json"
}
```

The response also includes `failedDetails` and `siwxDetails` when relevant.

## Check Registered Resources for an Origin

After registering, list resources x402scan knows about for an origin:

```http
GET /api/x402/registry/origin?url=https%3A%2F%2Fapi.example.com
```

Example:

```bash
curl 'https://www.x402scan.com/api/x402/registry/origin?url=https%3A%2F%2Fapi.example.com'
```

This read endpoint does not require SIWX headers.

## Registration Requirements

For single-resource registration, the endpoint must return a parseable x402
`402 Payment Required` response when probed. For origin registration, expose
OpenAPI or `/.well-known/x402` discovery so x402scan can find the resource URLs.

For indexed paid resources, the 402 challenge should include:

- at least one x402 payment option on a supported network
- a schema x402scan can use for Bazaar/tool invocation metadata
- stable origin metadata, including title, description, and favicon when
  available

See [DISCOVERY.md](./DISCOVERY.md) for the full discovery and registration
contract.
