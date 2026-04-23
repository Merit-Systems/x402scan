# x402scan API - Programmatic Resource Management

x402scan exposes REST API endpoints that let you register and manage x402 resources programmatically. This is useful for resource providers who want to automatically update their listings after deploying new endpoints, or for CI/CD pipelines that keep x402scan in sync with your services.

## Endpoints

### Register a Single Resource

```
POST /api/resources/register
```

Probes the given URL with both POST and GET requests looking for a `402 Payment Required` response. If found, the x402 payment requirements are parsed and the resource is registered.

**Request Body**

| Field     | Type                        | Required | Description                                  |
|-----------|-----------------------------|----------|----------------------------------------------|
| `url`     | `string` (valid URL)        | Yes      | The URL of the x402 resource to register.    |
| `headers` | `Record<string, string>`    | No       | Custom headers to include when probing.      |

**Example**

```bash
curl -X POST https://x402scan.com/api/resources/register \
  -H "Content-Type: application/json" \
  -d '{"url": "https://my-api.com/api/paid-endpoint"}'
```

**Response (success)**

```json
{
  "success": true,
  "resource": {
    "resource": { "id": "...", "resource": "https://my-api.com/api/paid-endpoint", ... },
    "origin": { "id": "...", "origin": "https://my-api.com", ... },
    "accepts": [...]
  },
  "accepts": [...],
  "response": { ... },
  "methodUsed": "POST",
  "discovery": {
    "found": true,
    "source": "well-known",
    "otherResourceCount": 3,
    "origin": "https://my-api.com",
    "resources": ["https://my-api.com/api/other-endpoint", ...]
  }
}
```

**Response (no 402 detected)**

```json
{
  "success": false,
  "error": {
    "type": "no402",
    "message": "The URL did not respond with HTTP 402 for any method (POST, GET)"
  }
}
```

---

### Register All Resources from an Origin

```
POST /api/resources/register/origin
```

Discovers all x402 resources at an origin using the [discovery protocol](./DISCOVERY.md) (DNS TXT records or `/.well-known/x402`), then registers each one. Resources that are no longer listed in the discovery document are automatically deprecated.

**Request Body**

| Field    | Type                  | Required | Description                              |
|----------|-----------------------|----------|------------------------------------------|
| `origin` | `string` (valid URL)  | Yes      | The origin URL (e.g. `https://my-api.com`). |

**Example**

```bash
curl -X POST https://x402scan.com/api/resources/register/origin \
  -H "Content-Type: application/json" \
  -d '{"origin": "https://my-api.com"}'
```

**Response (success)**

```json
{
  "success": true,
  "registered": 5,
  "failed": 1,
  "deprecated": 0,
  "total": 6,
  "source": "well-known",
  "failedDetails": [
    {
      "url": "https://my-api.com/api/broken-endpoint",
      "error": "POST: Expected 402, got 500; GET: Expected 402, got 500",
      "status": 500
    }
  ],
  "originId": "uuid-of-origin"
}
```

**Response (no discovery document)**

```json
{
  "success": false,
  "error": {
    "type": "noDiscovery",
    "message": "No discovery document found"
  }
}
```

---

## Typical Workflows

### After deploying a new endpoint

If you add a new x402-protected route, register it immediately:

```bash
curl -X POST https://x402scan.com/api/resources/register \
  -H "Content-Type: application/json" \
  -d '{"url": "https://my-api.com/api/new-endpoint"}'
```

### Refreshing all resources from your origin

If you maintain a `/.well-known/x402` discovery document, you can refresh everything in one call. This also deprecates resources you've removed:

```bash
curl -X POST https://x402scan.com/api/resources/register/origin \
  -H "Content-Type: application/json" \
  -d '{"origin": "https://my-api.com"}'
```

### CI/CD integration

Add a step to your deployment pipeline:

```yaml
# GitHub Actions example
- name: Update x402scan listing
  run: |
    curl -X POST https://x402scan.com/api/resources/register/origin \
      -H "Content-Type: application/json" \
      -d '{"origin": "https://my-api.com"}'
```

## Discovery Protocol

For the origin registration endpoint to work, your server needs to implement the x402 discovery protocol. See [DISCOVERY.md](./DISCOVERY.md) for details on setting up DNS TXT records or a `/.well-known/x402` document.
