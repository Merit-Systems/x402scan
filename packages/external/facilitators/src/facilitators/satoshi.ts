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
    image: 'https://x402scan.com/satoshi-api.svg',
    docsUrl: 'https://facilitator.bitcoinsapi.com/docs',
    color: '#F59E0B',
  },
  config: satoshi,
  discoveryConfig: satoshiDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xe166267c3648b5ca4419F2c58fAEd8Cd4DF87d54',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-04-06T03:01:11Z'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
