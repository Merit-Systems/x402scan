import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const satoshi: FacilitatorConfig = {
  url: 'https://facilitator.bitcoinsapi.com',
};

export const satoshiDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.bitcoinsapi.com',
};

export const satoshiFacilitator = {
  id: 'satoshi',
  metadata: {
    name: 'Satoshi API',
    image: 'https://x402scan.com/satoshi.png',
    docsUrl: 'https://github.com/Bortlesboat/x402-facilitator',
    color: '#F7931A',
  },
  config: satoshi,
  discoveryConfig: satoshiDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xe166267c3648b5ca4419f2c58faed8cd4df87d54',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-04-06'),
      },
    ],
  },
} as const satisfies Facilitator;
