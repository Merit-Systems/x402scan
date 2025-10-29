# facilitators

Configuration and validation utilities for X402 payment facilitators across multiple blockchain networks.

## Installation

```bash
npm install facilitators
# or
yarn add facilitators
# or
pnpm add facilitators
```

## Usage

### Import Facilitator Configuration

```typescript
import { FACILITATORS, FACILITATORS_BY_CHAIN, Chain } from 'facilitators';

// Get all facilitators
console.log(FACILITATORS);

// Get facilitators by chain
const baseFacilitators = FACILITATORS_BY_CHAIN(Chain.BASE);
const solanaFacilitators = FACILITATORS_BY_CHAIN(Chain.SOLANA);
```

### Import Individual Facilitators

```typescript
import { coinbase, thirdweb, payai } from 'facilitators';

console.log(coinbase);
// {
//   id: 'coinbase',
//   name: 'Coinbase',
//   image: 'https://x402scan.com/coinbase.png',
//   link: 'https://docs.cdp.coinbase.com/x402/welcome',
//   color: 'var(--color-primary)',
//   addresses: { ... }
// }
```

### Types (Separate Import)

You can import types separately from the runtime code:

```typescript
import type {
  Facilitator,
  FacilitatorConfig,
  Token,
  Chain,
} from 'facilitators/types';

// Or import from the main package
import type { Facilitator, Chain } from 'facilitators';
```

#### Type Definitions

```typescript
// Chain enum
enum Chain {
  BASE = 'base',
  POLYGON = 'polygon',
  SOLANA = 'solana',
}

// Facilitator configuration
interface FacilitatorConfig {
  address: string;
  token: Token;
  syncStartDate: Date;
  enabled: boolean;
}

// Facilitator details
interface Facilitator {
  id: string;
  name: string;
  image: string;
  link: string;
  color: string;
  addresses: Partial<Record<Chain, FacilitatorConfig[]>>;
}

// Token configuration
interface Token {
  address: string;
  decimals: number;
  symbol: string;
}
```

### Constants

```typescript
import {
  USDC_BASE,
  USDC_POLYGON,
  USDC_SOLANA,
  USDC_DECIMALS,
  USDC_MULTIPLIER,
  USDC_BASE_TOKEN,
  USDC_SOLANA_TOKEN,
  USDC_POLYGON_TOKEN,
} from 'facilitators';

// Token addresses and configuration
console.log(USDC_BASE_TOKEN);
// { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, symbol: 'USDC' }
```

### Validation

```typescript
import { validateUniqueFacilitators } from 'facilitators';
import type { Facilitator } from 'facilitators/types';

// Validate facilitator configuration at compile time
const facilitators = validateUniqueFacilitators([
  {
    id: 'my-facilitator',
    name: 'My Facilitator',
    // ... configuration
  } as Facilitator,
]);
```

## Package Structure

```
facilitators/
├── src/
│   ├── facilitators/       # Individual facilitator files
│   │   ├── coinbase.ts
│   │   ├── aurracloud.ts
│   │   ├── thirdweb.ts
│   │   ├── x402rs.ts
│   │   ├── payai.ts
│   │   ├── corbits.ts
│   │   ├── dexter.ts
│   │   ├── daydreams.ts
│   │   ├── mogami.ts
│   │   ├── openx402.ts
│   │   └── index.ts        # Combines all facilitators
│   ├── types.ts            # Type definitions
│   ├── config.ts           # Re-exports from facilitators/
│   ├── constants.ts        # Constants (USDC addresses, etc.)
│   ├── validate.ts         # Validation utilities
│   └── index.ts            # Main exports
├── index.ts                # Package entry point
├── types.ts                # Types-only entry point
└── dist/                   # Built files (generated)
```

## Exports

The package provides multiple export options:

- **`facilitators`** - Main export with all runtime code and types
- **`facilitators/types`** - Types-only export for better tree-shaking

### Available Exports

```typescript
// Collections
import { FACILITATORS, FACILITATORS_BY_CHAIN } from 'facilitators';

// Individual facilitators
import {
  coinbase,
  aurracloud,
  thirdweb,
  x402rs,
  payai,
  corbits,
  dexter,
  daydreams,
  mogami,
  openx402,
} from 'facilitators';

// Constants
import {
  USDC_BASE,
  USDC_POLYGON,
  USDC_SOLANA,
  USDC_DECIMALS,
  USDC_MULTIPLIER,
  USDC_BASE_TOKEN,
  USDC_SOLANA_TOKEN,
  USDC_POLYGON_TOKEN,
  DEFAULT_CONTRACT_ADDRESS,
  TRANSFER_EVENT_SIG,
  TRANSFER_TOPIC,
  ONE_DAY_IN_MS,
  ONE_MINUTE_IN_SECONDS,
} from 'facilitators';

// Utilities
import { validateUniqueFacilitators } from 'facilitators';

// Types
import type {
  Chain,
  Facilitator,
  FacilitatorConfig,
  Token,
} from 'facilitators';
// or
import type {
  Chain,
  Facilitator,
  FacilitatorConfig,
  Token,
} from 'facilitators/types';
```

## Supported Facilitators

This package includes configuration for the following X402 facilitators:

- **Coinbase** - BASE, SOLANA
- **AurraCloud** - BASE
- **thirdweb** - BASE
- **X402rs** - BASE, POLYGON
- **PayAI** - BASE, SOLANA
- **Corbits** - SOLANA
- **Dexter** - SOLANA
- **Daydreams** - BASE, SOLANA
- **Mogami** - BASE
- **OpenX402** - BASE, SOLANA

## Supported Chains

- **Base** (Layer 2 Ethereum)
- **Polygon** (Ethereum sidechain)
- **Solana**

## Adding New Facilitators

To add a new facilitator:

1. Create a new file in `src/facilitators/` (e.g., `newfacilitator.ts`)
2. Export the facilitator configuration
3. Add the import and export to `src/facilitators/index.ts`

Example:

```typescript
// src/facilitators/newfacilitator.ts
import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

export const newfacilitator: Facilitator = {
  id: 'newfacilitator',
  name: 'New Facilitator',
  image: 'https://x402scan.com/newfacilitator.png',
  link: 'https://newfacilitator.com',
  color: 'var(--color-blue-500)',
  addresses: {
    [Chain.BASE]: [
      {
        address: '0x...',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-01-01'),
        enabled: true,
      },
    ],
  },
};
```

Then update `src/facilitators/index.ts`:

```typescript
import { newfacilitator } from './newfacilitator';
export { newfacilitator } from './newfacilitator';

export const FACILITATORS: Facilitator[] = [
  // ... existing facilitators
  newfacilitator,
];
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Type check
pnpm typecheck
```

## Publishing

```bash
# Bump version
npm version patch|minor|major

# Publish to npm
npm publish
```

See [PUBLISHING.md](./PUBLISHING.md) for detailed publishing instructions.

## License

MIT
