![X402 Facilitators](assets/banner.gif)

# facilitators

The `facilitators` package offers a unified, drop-in configuration for all x402 facilitators

## Installation

```bash
npm install facilitators
# or
yarn add facilitators
# or
pnpm add facilitators
```

## Quick Start

### Minimal Example

```typescript
import { coinbase, thirdweb } from 'facilitators';

paymentMiddleware(
  address,
  resources,
  coinbase // easily interchange any facilitator
);

paymentMiddleware(
  address,
  resources,
  thirdweb // easily interchange any facilitator
);
```

## Resource Discovery

Some facilitators support **discovery** - the ability to list all x402-protected resources they're facilitating.

This is useful for building agents that search for tools.

### Discovery API

```typescript
import { coinbaseDiscovery, listAllFacilitatorResources } from 'facilitators';

// List all resources from a facilitator
const resources = await listAllFacilitatorResources(coinbaseDiscovery);
```

### Facilitators Supporting Discovery

The following facilitators currently support resource discovery:

- **Coinbase** - Enterprise-grade facilitator with SDK
- **AurraCloud** - Infrastructure-focused facilitator
- **thirdweb** - Web3 development platform
- **PayAI** - AI-payment infrastructure

### Enumerate All Discoverable Facilitators

The package also exports a list of all facilitators that support discovery:

```typescript
import {
  discoverableFacilitators,
  listAllFacilitatorResources,
} from 'facilitators';

await Promise.all(
  discoverableFacilitators.map(facilitator =>
    listAllFacilitatorResources(facilitator)
  )
);
```

## Available Facilitators

This package includes pre-configured integrations for the following X402 facilitators:

| Facilitator    | Networks      | Discovery | Setup Required                 |
| -------------- | ------------- | --------- | ------------------------------ |
| **Coinbase**   | BASE, SOLANA  | ✅ Yes    | No - uses `@coinbase/x402` SDK |
| **AurraCloud** | BASE          | ✅ Yes    | Yes - API key                  |
| **thirdweb**   | BASE          | ✅ Yes    | Yes - Secret key & wallet      |
| **PayAI**      | BASE, SOLANA  | ✅ Yes    | No                             |
| **Daydreams**  | BASE, SOLANA  | No        | No                             |
| **X402rs**     | BASE, POLYGON | No        | No                             |
| **Corbits**    | SOLANA        | No        | No                             |
| **Dexter**     | SOLANA        | No        | No                             |
| **Mogami**     | BASE          | No        | No                             |
| **OpenX402**   | BASE, SOLANA  | No        | No                             |
| **Questflow**  | BASE          | ✅ Yes    | Yes - API key                  |
| **xEcho**      | BASE          | No        | No                             |
| **CodeNut**    | BASE          | No        | No                             |
| **Mercuri**    | BASE, SOLANA  | ✅ Yes    | No                             |

### Import Individual Facilitators

```typescript
// Simple facilitators (no setup)
import {
  coinbase,
  payai,
  daydreams,
  x402rs,
  corbits,
  dexter,
  mogami,
  openx402,
  xecho,
  codenut,
} from 'facilitators';

// Facilitators requiring setup
import { aurracloud, thirdweb, questflow } from 'facilitators';

aurracloud({
  apiKey: process.env.AURRACLOUD_API_KEY,
});

questflow({
  apiKey: process.env.QUESTFLOW_API_KEY,
});

thirdweb({
  walletSecret: process.env.THIRDWEB_NEXUS_SECRET_KEY,
  walletAddress: process.env.SERVER_WALLET,
});
```

### Access Facilitator Metadata

```typescript
import { coinbaseFacilitator, payaiFacilitator } from 'facilitators';

console.log(coinbaseFacilitator);
// {
//   id: 'coinbase',
//   metadata: {
//     name: 'Coinbase',
//     image: 'https://x402scan.com/coinbase.png',
//     docsUrl: 'https://docs.cdp.coinbase.com/x402/welcome',
//     color: '#2563EB'
//   },
//   config: { ... },
//   addresses: { base: [...], solana: [...] },
//   discoveryConfig: { ... }
// }
```

## Types

### `Facilitator<Props>`

Represents a complete facilitator with configuration and metadata:

```typescript
interface Facilitator<Props = void> {
  id: string; // Unique identifier
  metadata: FacilitatorMetadata; // Display info (name, image, docs)
  config: FacilitatorConfig | FacilitatorConfigConstructor<Props>;
  addresses: Partial<Record<Network, FacilitatorAddress[]>>;
  discoveryConfig?: FacilitatorConfig; // For resource discovery
}
```

### `FacilitatorConfig`

Configuration passed to X402 middleware for payment verification:

```typescript
// From 'x402/types'
type FacilitatorConfig = {
  url: string; // Facilitator API endpoint
};
```

### `FacilitatorConfigConstructor<Props>`

For facilitators requiring initialization parameters:

```typescript
type FacilitatorConfigConstructor<Props = void> = (
  requirements: Props
) => FacilitatorConfig;
```

**Example - Simple facilitator (no setup required):**

```typescript
import { payai } from 'facilitators';

// Use directly - just a URL configuration
paymentMiddleware(address, resources, payai);
```

**Example - Facilitator with required props:**

```typescript
import { aurracloud } from 'facilitators';

// Must call with required props first
paymentMiddleware(
  address,
  resources,
  aurracloud({ apiKey: process.env.AURRACLOUD_API_KEY })
);
```

### `FacilitatorMetadata`

Display information for UIs:

```typescript
interface FacilitatorMetadata {
  name: string; // Display name
  image: string; // Logo URL
  docsUrl: string; // Documentation link
  color: string; // Brand color
}
```

### `Network`

Supported blockchain networks:

```typescript
enum Network {
  BASE = 'base',
  POLYGON = 'polygon',
  SOLANA = 'solana',
}
```
