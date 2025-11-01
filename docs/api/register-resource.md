# Programmatic Resource Registration API

## Overview

The `/api/v1/resources/register` endpoint allows resource providers to programmatically add or refresh their x402 resources on x402scan. This enables automatic updates when your x402 offering changes.

## Endpoint

```
POST /api/v1/resources/register
```

## Request

### Headers

```
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The URL of the x402 resource to register. Must be a valid URL. |
| `headers` | object | No | Optional custom headers to send with the request (key-value pairs) |
| `body` | object | No | Optional request body for POST requests |

### Example Request

```bash
curl -X POST https://www.x402scan.com/api/v1/resources/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/data"
  }'
```

With optional headers and body:

```bash
curl -X POST https://www.x402scan.com/api/v1/resources/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.example.com/data",
    "headers": {
      "X-Custom-Header": "value"
    },
    "body": {
      "param": "value"
    }
  }'
```

## Response

### Success Response (200 OK)

When a resource is successfully registered, the endpoint returns detailed information about the resource:

```json
{
  "error": false,
  "resource": {
    "id": "cm2abc123",
    "resource": "https://api.example.com/data",
    "type": "http",
    "x402Version": "0.1",
    "lastUpdated": "2025-10-23T20:00:00.000Z",
    "accepts": {
      "network": "base_sepolia",
      "token": "USDC",
      "recipient": "0x1234...",
      "maxAmountRequired": "1000000"
    }
  },
  "enhancedParseWarnings": null,
  "response": {
    // Full x402 response from the resource
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid URL

```json
{
  "error": true,
  "type": "validation",
  "message": "Invalid input",
  "issues": [
    {
      "code": "invalid_format",
      "format": "url",
      "path": ["url"],
      "message": "Invalid URL"
    }
  ]
}
```

#### 400 Bad Request - No 402 Response

```json
{
  "error": true,
  "type": "no402",
  "message": "The resource did not respond with a 402 status code"
}
```

#### 400 Bad Request - Parse Errors

```json
{
  "error": true,
  "type": "parseErrors",
  "parseErrorData": {
    "parseErrors": [
      "accepts.0.network: Invalid network"
    ],
    "data": {
      // Raw response data
    }
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": true,
  "type": "server",
  "message": "Internal server error"
}
```

## How It Works

1. The endpoint validates the input URL format
2. It attempts to ping your resource with both GET and POST methods
3. It looks for a 402 Payment Required status code
4. If found, it validates the x402 response format
5. It scrapes metadata from your origin (title, description, favicon, OG images)
6. It stores the resource information in the x402scan database
7. It returns the registered resource details

## Use Cases

- **Automatic Updates**: Set up a webhook or cron job to refresh your resource listing when you deploy changes
- **CI/CD Integration**: Add resource registration to your deployment pipeline
- **Bulk Registration**: Register multiple endpoints programmatically
- **Testing**: Verify your x402 implementation is discoverable

## Rate Limiting

Currently, there are no rate limits on this endpoint. However, please be respectful and avoid excessive requests.

## Support

If you encounter issues or have questions:
- Open an issue on [GitHub](https://github.com/Merit-Systems/x402scan/issues)
- Join the x402 community discussions
- Contact the Merit Systems team

## Related Endpoints

- `GET /api/v1/list-resources` - List all registered x402 resources
- `POST /api/resources/sync` - Internal sync endpoint (requires authentication)