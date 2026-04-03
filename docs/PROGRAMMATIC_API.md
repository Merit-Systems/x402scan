# Programmatic Resource Registration API

x402scan exposes a public REST API that allows resource providers to register and refresh their x402-protected resources programmatically — no wallet authentication required.

## Base URL

```
https://x402scan.com/api/v1
```

## Endpoints

### Register a Single Resource

```
POST /api/v1/resources/register
```

Register a single x402-protected resource by URL. The endpoint probes the URL for a `402 Payment Required` response, parses the payment information, and adds it to the x402scan registry.

**Request Body:**

```json
{
  "url": "https://your-server.com/api/paid-endpoint"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "resource": {
    "id": "...",
    "resource": "https://your-server.com/api/paid-endpoint",
    "origin": { "id": "...", "origin": "https://your-server.com" }
  },
  "accepts": [...],
  "registrationDetails": { ... }
}
```

**Error Response (422):**

```json
{
  "success": false,
  "error": {
    "type": "no_402",
    "message": "URL did not return a 402 Payment Required response"
  }
}
```

### Register All Resources from an Origin

```
POST /api/v1/resources/register-origin
```

Discover and register all x402-protected resources from an origin. Uses [OpenAPI discovery](./DISCOVERY.md), DNS TXT records (`_x402.{hostname}`), or `/.well-known/x402` to find resources.

**Request Body:**

```json
{
  "origin": "https://your-server.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "registered": 5,
  "failed": 0,
  "skipped": 1,
  "deprecated": 0,
  "total": 6,
  "source": "openapi"
}
```

### Refresh a Resource

```
POST /api/v1/resources/refresh
```

Re-probe an existing resource and update its registration data. Use this after updating your server's pricing, payment options, or schema to ensure x402scan reflects the latest configuration.

**Request Body:**

```json
{
  "url": "https://your-server.com/api/paid-endpoint"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Resource refreshed successfully",
  "resource": { ... },
  "accepts": [...],
  "registrationDetails": { ... }
}
```

## Error Responses

All endpoints return errors in a consistent format:

| Status | Type | Description |
|--------|------|-------------|
| 400 | `invalid_json` | Request body is not valid JSON |
| 400 | `validation_error` | Missing or invalid fields in request body |
| 404 | `no_discovery` | No discovery document found at the origin |
| 422 | `no_402` | URL did not return a 402 Payment Required response |
| 422 | `parse_error` | Failed to parse the x402 payment response |
| 500 | `internal_error` | Unexpected server error |

## Examples

### cURL

```bash
# Register a single resource
curl -X POST https://x402scan.com/api/v1/resources/register \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-server.com/api/paid-endpoint"}'

# Register all resources from an origin
curl -X POST https://x402scan.com/api/v1/resources/register-origin \
  -H "Content-Type: application/json" \
  -d '{"origin": "https://your-server.com"}'

# Refresh a resource after updating pricing
curl -X POST https://x402scan.com/api/v1/resources/refresh \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-server.com/api/paid-endpoint"}'
```

### JavaScript / TypeScript

```typescript
// Register a resource
const response = await fetch('https://x402scan.com/api/v1/resources/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://your-server.com/api/paid-endpoint' }),
});
const result = await response.json();

if (result.success) {
  console.log('Registered:', result.resource.id);
} else {
  console.error('Failed:', result.error.message);
}
```

### Python

```python
import requests

# Register a resource
response = requests.post(
    "https://x402scan.com/api/v1/resources/register",
    json={"url": "https://your-server.com/api/paid-endpoint"},
)
result = response.json()

if result["success"]:
    print(f"Registered: {result['resource']['id']}")
else:
    print(f"Failed: {result['error']['message']}")
```

## CI/CD Integration

You can integrate resource registration into your deployment pipeline to automatically update x402scan when you deploy changes:

```yaml
# GitHub Actions example
- name: Register resources on x402scan
  run: |
    curl -X POST https://x402scan.com/api/v1/resources/register-origin \
      -H "Content-Type: application/json" \
      -d '{"origin": "${{ env.SERVER_URL }}"}'
```

## CORS

All endpoints support CORS with `Access-Control-Allow-Origin: *`, so they can be called from browser-based applications.
