# x402 Discovery Document

The x402 discovery document is a standardized way to help clients automatically discover all x402-enabled resources on your server. By implementing discovery, you make it easier for users and platforms like x402scan to find and register your resources.

## Table of Contents

- [What is x402 Discovery?](#what-is-x402-discovery)
- [Why Use Discovery?](#why-use-discovery)
- [Implementation Methods](#implementation-methods)
  - [Method 1: Well-Known URL (Recommended)](#method-1-well-known-url-recommended)
  - [Method 2: DNS TXT Record](#method-2-dns-txt-record)
- [Document Schema](#document-schema)
- [Ownership Verification](#ownership-verification)
- [Examples](#examples)
- [Testing Your Discovery Document](#testing-your-discovery-document)

## What is x402 Discovery?

The x402 discovery document is a JSON file that lists all x402-enabled endpoints on your server. It allows clients to automatically discover your resources without manually testing each endpoint.

## Why Use Discovery?

**Benefits for Server Operators:**
- **Automatic Registration**: Platforms like x402scan can automatically discover and register all your resources in one step
- **Better Visibility**: Your resources are more discoverable by users and applications
- **Ownership Verification**: Prove ownership of your resources through cryptographic signatures
- **Easier Updates**: Update your discovery document to add new resources without manual registration

**Benefits for Clients:**
- **One-Click Discovery**: Users can register all your resources at once instead of one-by-one
- **Trust**: Verify server ownership through cryptographic proofs
- **Efficiency**: Reduced network requests compared to testing each endpoint individually

## Implementation Methods

### Method 1: Well-Known URL (Recommended)

Host a JSON file at `/.well-known/x402` on your server.

**Setup:**

1. Create a JSON file with your discovery document (see [schema](#document-schema))
2. Place it at `https://yourdomain.com/.well-known/x402`
3. Ensure it's accessible via GET request
4. Set the `Content-Type` header to `application/json`

**Example Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "version": 1,
  "resources": [
    "https://yourdomain.com/api/endpoint1",
    "https://yourdomain.com/api/endpoint2"
  ],
  "ownershipProofs": [
    "0x1234567890abcdef..."
  ]
}
```

### Method 2: DNS TXT Record

Add a TXT record to your domain's DNS configuration that points to where your discovery document is hosted.

**Setup:**

1. Host your discovery document JSON file at a public URL (can be anywhere accessible)
2. Create a TXT record with the name `_x402`
3. Set the value to the URL where your discovery document is hosted

**Example DNS Record:**

```
_x402.yourdomain.com. TXT "https://yourdomain.com/x402-discovery.json"
```

Or if using the well-known path:

```
_x402.yourdomain.com. TXT "https://yourdomain.com/.well-known/x402"
```

**How it works:**
- Clients look up the `_x402` TXT record for your domain
- The TXT record contains a URL pointing to your discovery document
- Clients then fetch the discovery document from that URL
- This avoids DNS size limitations and allows you to update your resources without changing DNS records

## Document Schema

### Basic Structure

```typescript
{
  version: 1;                    // REQUIRED: Discovery document version (must be 1)
  resources: string[];           // REQUIRED: Array of full x402 endpoint URLs
  ownershipProofs?: string[];    // Optional cryptographic signatures proving ownership
  instructions?: string;         // Optional markdown instructions for users
}
```

### Field Descriptions

#### `version` (required)

The version number of the discovery document schema. Currently must be `1`.

**Requirements:**
- Must be the number `1` (not a string)
- Required field - document will fail validation without it

**Example:**

```json
{
  "version": 1,
  "resources": [
    "https://api.example.com/v1/generate"
  ]
}
```

#### `resources` (required)

An array of strings, where each string is a full URL to an x402-enabled endpoint.

**Requirements:**
- Must be valid URLs (including protocol)
- Must return a valid x402 402 response when accessed
- Should be publicly accessible

**Example:**

```json
{
  "version": 1,
  "resources": [
    "https://api.example.com/v1/generate-image",
    "https://api.example.com/v1/translate",
    "https://api.example.com/v1/analyze"
  ]
}
```

#### `ownershipProofs` (optional but recommended)

An array of cryptographic signatures that prove you control the `payTo` addresses in your x402 responses. This helps establish trust and verify ownership.

**How it works:**
1. Sign your origin URL (e.g., `https://api.example.com`) with the private key corresponding to your `payTo` address
2. Include the signature(s) in the `ownershipProofs` array
3. Platforms like x402scan will verify that the recovered address matches one of your `payTo` addresses

**Example:**

```json
{
  "version": 1,
  "resources": [
    "https://api.example.com/v1/endpoint"
  ],
  "ownershipProofs": [
    "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b"
  ]
}
```

#### `instructions` (optional)

A markdown-formatted string containing instructions or information for users of your resources. This can be displayed to users when they discover your resources, providing context, usage guidelines, or other helpful information.

**Use cases:**
- Explain how to use your resources
- Provide API documentation links
- List rate limits or usage restrictions
- Add contact information for support
- Include terms of service or pricing information

**Example:**

```json
{
  "version": 1,
  "resources": [
    "https://api.example.com/v1/generate",
    "https://api.example.com/v1/analyze"
  ],
  "ownershipProofs": [
    "0x1234567890abcdef..."
  ],
  "instructions": "Example app instructions. Always call analyze first before calling generate."
}
```

**Note**: The instructions field supports markdown formatting, allowing you to include headers, links, lists, and other formatted content.

## Ownership Verification

Ownership verification allows you to prove that you control the payment addresses (`payTo`) specified in your x402 resources.

### How to Generate an Ownership Proof

1. **Get your origin URL**: This is the base URL of your server (e.g., `https://api.example.com`)

2. **Sign the origin URL**: Use your private key (corresponding to your `payTo` address) to sign the origin URL

   **Example using ethers.js (for EVM chains):**

   ```javascript
   import { Wallet } from 'ethers';

   const privateKey = 'your-private-key';
   const wallet = new Wallet(privateKey);

   const origin = 'https://api.example.com';
   const signature = await wallet.signMessage(origin);

   console.log('Ownership proof:', signature);
   ```

   **Example using @solana/web3.js (for Solana):**

   ```javascript
   import { Keypair } from '@solana/web3.js';
   import * as nacl from 'tweetnacl';

   const keypair = Keypair.fromSecretKey(secretKeyUint8Array);
   const origin = 'https://api.example.com';
   const message = new TextEncoder().encode(origin);
   const signature = nacl.sign.detached(message, keypair.secretKey);
   const signatureHex = '0x' + Buffer.from(signature).toString('hex');

   console.log('Ownership proof:', signatureHex);
   ```

3. **Add to discovery document**: Include the signature in the `ownershipProofs` array

### Multiple Payment Addresses

If your resources accept payments to multiple addresses, you should provide an ownership proof for each one:

```json
{
  "version": 1,
  "resources": [
    "https://api.example.com/v1/endpoint"
  ],
  "ownershipProofs": [
    "0x1234...abcd",  // Signature from address 1
    "0x5678...ef01"   // Signature from address 2
  ]
}
```

### Verification Process

When platforms like x402scan discover your resources, they:

1. Fetch your discovery document
2. Test each resource endpoint to get the `payTo` addresses
3. Recover the address from each ownership proof signature
4. Check if any recovered address matches any `payTo` address
5. Mark your origin as "Verified" if a match is found

## Examples

### Simple Discovery Document

A minimal discovery document with two resources:

```json
{
  "version": 1,
  "resources": [
    "https://api.example.com/v1/generate",
    "https://api.example.com/v1/analyze"
  ]
}
```

### Discovery Document with Ownership Proof

A discovery document with ownership verification:

```json
{
  "version": 1,
  "resources": [
    "https://api.example.com/v1/generate",
    "https://api.example.com/v1/analyze",
    "https://api.example.com/v1/translate"
  ],
  "ownershipProofs": [
    "0x8f6d4e3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e1b"
  ]
}
```

### Complete Discovery Document with Instructions

A full discovery document with ownership proof and user instructions:

```json
{
  "version": 1,
  "resources": [
    "https://api.example.com/v1/generate-image",
    "https://api.example.com/v1/analyze-text",
    "https://api.example.com/v1/translate"
  ],
  "ownershipProofs": [
    "0x8f6d4e3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e1b"
  ],
  "instructions": "# Example API Resources\n\nThese endpoints provide AI-powered services.\n\n## Authentication\n\nNo API key required for x402 payments.\n\n## Rate Limits\n\n- 1000 requests per hour\n- Max 10MB per request\n\n## Support\n\nQuestions? Email support@example.com\n\nDocumentation: https://docs.example.com"
}
```

### Complete Example with Express.js

```javascript
import express from 'express';

const app = express();

// Serve discovery document at /.well-known/x402
app.get('/.well-known/x402', (req, res) => {
  res.json({
    version: 1,
    resources: [
      'https://api.example.com/api/v1/generate-image',
      'https://api.example.com/api/v1/analyze-text',
      'https://api.example.com/api/v1/translate'
    ],
    ownershipProofs: [
      // Generated using your private key
      '0x8f6d4e3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e1b'
    ],
    instructions: '# API Documentation\n\nVisit https://docs.example.com for full documentation.\n\n## Rate Limits\n- 1000 requests/hour\n\n## Support\nEmail: support@example.com'
  });
});

app.listen(3000);
```

### Complete Example with Next.js

```typescript
// app/api/.well-known/x402/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: 1,
    resources: [
      'https://yourapp.com/api/v1/generate',
      'https://yourapp.com/api/v1/analyze'
    ],
    ownershipProofs: [
      // Your ownership proof signature
      '0x1234567890abcdef...'
    ],
    instructions: '# API Usage\n\nSee [documentation](https://yourapp.com/docs) for details.\n\nContact: api@yourapp.com'
  });
}
```

## Testing Your Discovery Document

### Using x402scan

1. Go to [x402scan.com/resources/register](https://x402scan.com/resources/register)
2. Enter your origin URL (e.g., `https://api.example.com`)
3. x402scan will automatically:
   - Check for your discovery document
   - Test all discovered resources
   - Verify ownership proofs (if provided)
   - Show you the results

### Using the Developer Test Page

1. Go to [x402scan.com/developer](https://x402scan.com/developer)
2. Enter your origin URL
3. View detailed test results including:
   - Discovery document validation
   - Individual resource testing
   - Ownership verification status
   - Schema validation

### Manual Testing

Test your discovery document directly:

```bash
# Test well-known URL
curl https://yourdomain.com/.well-known/x402

# Test DNS TXT record (shows the URL)
dig _x402.yourdomain.com TXT

# Then fetch the discovery document from that URL
curl $(dig +short _x402.yourdomain.com TXT | tr -d '"')
```

## Best Practices

1. **Keep it updated**: Update your discovery document when adding or removing resources
2. **Include ownership proofs**: This builds trust and helps verify your resources are legitimate
3. **Use HTTPS**: Always serve your discovery document over HTTPS
4. **Test regularly**: Periodically test your discovery document to ensure it's working
5. **Monitor resources**: Ensure all listed resources are online and returning valid x402 responses
6. **Document your API**: Consider linking to API documentation from your resource descriptions

## Troubleshooting

### Discovery Document Not Found

- **Well-known URL**: Ensure the file is accessible at `/.well-known/x402` (note: no file extension)
- **DNS TXT**: Verify the TXT record exists with `dig _x402.yourdomain.com TXT`
- **CORS**: If serving from a different domain, ensure proper CORS headers are set

### Resources Not Registering

- **Invalid URLs**: Ensure all resource URLs are complete and valid
- **402 Response**: Verify each resource returns a valid x402 402 response
- **Network Access**: Confirm resources are publicly accessible

### Ownership Verification Failing

- **Signature Format**: Ensure signatures are hex strings starting with `0x`
- **Message Signed**: Verify you signed the exact origin URL (including protocol, no trailing slash. Ex https://api.example.com)
- **Correct Key**: Confirm you used the private key corresponding to your `payTo` address
- **Chain Compatibility**: Make sure you're using the correct signing method for your blockchain (EVM vs Solana)

## Additional Resources

- [x402 Specification](https://www.x402.org/)
- [x402scan Platform](https://x402scan.com)
- [Example Implementations](https://github.com/Merit-Systems/x402scan/tree/main/examples)
