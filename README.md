<div align="center">

# x402scan

</div>

<div align="center">
    
  [![Discord](https://img.shields.io/discord/1382120201713352836?style=flat&logo=discord&logoColor=white&label=Discord)](https://discord.gg/JuKt7tPnNc) 
  ![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/merit_systems) 
  [![GitHub Repo stars](https://img.shields.io/github/stars/Merit-Systems/x402scan?style=social)](https://github.com/Merit-Systems/x402scan) 
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

</div>

[x402scan](https://x402scan.com) is an ecosystem explorer for [x402](https://www.x402.org/), a new standard for digital payments. It's live at [x402scan.com](https://x402scan.com).

![x402scan screenshot](./preview.png)

x402 API resources can be be purchased just-in-time without a prior relationship with the seller using cryptocurrency. x402 is vision for an internet without ads or centralized intermediaries.

x402scan lets you explore the ecosystem of x402 servers, see their transaction volumes and directly access their resources through an embedded wallet.

## Monorepo Structure

This is a pnpm monorepo with the following workspaces:

- **scan/** - Next.js web application (x402scan.com)
- **sync/** - Background sync service using Trigger.dev
- **facilitators/** - Shared facilitator configuration

## Development

_Note: We're working on making this easier to spin-up. If you have any trouble in the mean time, please reach out._

Fill out a `.env.example` with the variables in `scan/.env.example`.

Then install and run:

```bash
# Install dependencies
pnpm install

# Run the frontend
pnpm dev

# Run the sync service
pnpm dev:sync
```

## Contributing

We're actively seeking contributors to help build x402scan. We believe an ecosystem explorer will shed light on the activities happening over x402, build trust, and help standardize interaction patterns to grow the ecosystem massively.

### Add Resources

If you know of a resource that is not yet listed, you can add it by visiting [https://www.x402scan.com/resources/register](https://www.x402scan.com/resources/register) and submitting the URL. If the URL returns a valid x402 schema, it will be added to the resources list automatically.

### Add Facilitators

If you know of another facilitator that is not listed, you can add it by following these steps:

To add a new facilitator:

1. Add the facilitator logo to `apps/scan/public/` (e.g., `my-facilitator.png`)

2. Create a new facilitator file in `packages/facilitators/src/facilitators/` (e.g., `my-facilitator.ts`):

```typescript
import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';
import type { Facilitator, FacilitatorConfig } from '../types';

export const myFacilitator: FacilitatorConfig = {
  url: 'https://facilitator.my-facilitator.com',
};

export const myFacilitatorFacilitator = {
  id: 'my-facilitator',
  metadata: {
    name: 'My Facilitator',
    image: 'https://x402scan.com/my-facilitator.png',
    docsUrl: 'https://my-facilitator.com',
    color: '#6366F1',
  },
  config: myFacilitator,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x...', // Your facilitator address
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-01-01'),
      },
    ],
  },
} as const satisfies Facilitator;
```

3. Export it in `packages/facilitators/src/facilitators/index.ts`:

```typescript
export { myFacilitator, myFacilitatorFacilitator } from './my-facilitator';
```

4. Add it to the list in `packages/facilitators/src/lists/all.ts`:
   - Import: `import { myFacilitatorFacilitator } from '../facilitators';`
   - Add to `FACILITATORS` array: `myFacilitatorFacilitator,`

5. Run `pnpm check:types` to validate your changes
