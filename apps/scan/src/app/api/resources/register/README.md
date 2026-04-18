# Programmatic Resource Registration API

## Endpoint

```
POST /api/resources/register
```

No authentication required. Designed for resource providers to register and refresh their x402-compatible resources programmatically.

## Request Body

The request body must be JSON with **one of** the following fields:

### Single Resource Registration

```json
{
  "url": "https://api.example.com/v1/chat"
}
```

Registers a single x402-protected resource by URL. The endpoint will be probed to verify it returns a valid 402 response.

### Origin-Based Registration

```json
{
  "origin": "https://api.example.com"
}
```

Discovers and registers all x402 resources from an origin. The server will look for:
- `.well-known/x402` discovery document
- OpenAPI spec with x402 extensions

## Response

### Success (Single Resource)

```json
{
  "success": true,
  "mode": "single",
  "resource": { ... },
  "accepts": [ ... ],
  "registrationDetails": { ... }
}
```

### Success (Origin-Based)

```json
{
  "success": true,
  "mode": "origin",
  "registered": 5,
  "failed": 0,
  "skipped": 2,
  "deprecated": 0,
  "total": 7,
  "source": "well-known"
}
```

### Error Responses

- `400` - Invalid JSON or validation error
- `404` - No discovery document found (origin mode only)
- `422` - Resource does not return valid 402 response or parse error

## Examples

### Register a single resource with curl

```bash
curl -X POST https://x402scan.com/api/resources/register \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.example.com/v1/chat"}'
```

### Register all resources from an origin

```bash
curl -X POST https://x402scan.com/api/resources/register \
  -H "Content-Type: application/json" \
  -d '{"origin": "https://api.example.com"}'
```

### JavaScript/TypeScript

```typescript
// Register a single resource
const response = await fetch("https://x402scan.com/api/resources/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://api.example.com/v1/chat" }),
});
const result = await response.json();

// Register all resources from an origin
const response = await fetch("https://x402scan.com/api/resources/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ origin: "https://api.example.com" }),
});
const result = await response.json();
```

### Python

```python
import requests

# Register a single resource
response = requests.post(
    "https://x402scan.com/api/resources/register",
    json={"url": "https://api.example.com/v1/chat"}
)
result = response.json()

# Register all resources from an origin
response = requests.post(
    "https://x402scan.com/api/resources/register",
    json={"origin": "https://api.example.com"}
)
result = response.json()
```

## Use Cases

- **CI/CD Integration**: Automatically register new resources when deploying
- **Resource Refresh**: Periodically re-register resources to update discovery data
- **Batch Registration**: Register all resources from a server at once using origin mode
