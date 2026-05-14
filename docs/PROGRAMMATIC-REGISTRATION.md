# Programmatic Resource Registration

Providers can register resources without using the web form by calling the public registration API. These endpoints perform the same validation as the in-app registration flow: x402scan probes the endpoint, requires a parseable `402` challenge for endpoint registration, and stores valid paid resources.

## Register One Resource

Use this when you want to add or refresh a specific resource URL.

```bash
curl -sS -X POST https://x402scan.com/api/v1/resources/register \
  -H "Content-Type: application/json" \
  -d '{"url":"https://yourdomain.com/api/paid-route"}'
```

Successful responses include the registered resource, the HTTP method that produced the x402 challenge, and discovery hints for other resources on the same origin.

```json
{
  "success": true,
  "methodUsed": "POST",
  "discovery": {
    "found": true,
    "otherResourceCount": 1,
    "origin": "https://yourdomain.com",
    "resources": ["https://yourdomain.com/api/other-paid-route"]
  }
}
```

If the URL does not return a valid x402 challenge, the API returns `422` with `success: false`.

## Register an Origin

Use this when your origin exposes OpenAPI discovery or `/.well-known/x402` and you want x402scan to register every discovered paid resource.

```bash
curl -sS -X POST https://x402scan.com/api/v1/resources/register-origin \
  -H "Content-Type: application/json" \
  -d '{"origin":"https://yourdomain.com"}'
```

The response reports how many discovered resources were registered, failed, or skipped.

## Request Schema

`POST /api/v1/resources/register`

```json
{
  "url": "https://yourdomain.com/api/paid-route"
}
```

`POST /api/v1/resources/register-origin`

```json
{
  "origin": "https://yourdomain.com"
}
```

Both endpoints accept JSON only. Invalid request bodies return `400`.

## Expected Resource Behavior

For endpoint registration, the target URL must return `402 Payment Required` with a parseable x402 challenge. Challenge data should include non-empty payment requirements and an input schema so x402scan can render the resource for users and agents.

For origin registration, publish discovery metadata using the [x402 Discovery Document Guide](./DISCOVERY.md). OpenAPI discovery is preferred; `/.well-known/x402` remains supported for compatibility.
