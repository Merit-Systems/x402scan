import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const acedatacloud: FacilitatorConfig = {
  url: 'https://facilitator.acedata.cloud',
};

export const acedatacloudDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.acedata.cloud',
};

export const acedatacloudFacilitator = {
  id: 'acedatacloud',
  metadata: {
    name: 'Ace Data Cloud',
    image: 'https://cdn.acedata.cloud/favicon.png',
    docsUrl: 'https://platform.acedata.cloud/.well-known/x402',
    color: '#15CDCE',
  },
  config: acedatacloud,
  discoveryConfig: acedatacloudDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x4F0E2D3477a1B94CF33d16E442CEe4733dadCeE7',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-04-30'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '5iVXFrYaYWX2GUTbkQj8mDBoBhAX8bneYigS2LJTia43',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-04-30'),
      },
    ],
  },
} as const satisfies Facilitator;
