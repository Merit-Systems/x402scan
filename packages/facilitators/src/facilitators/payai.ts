import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const payai: FacilitatorConfig = {
  url: 'https://facilitator.payai.network',
};

export const payaiDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.payai.network',
};

export const payaiFacilitator = {
  id: 'payAI',
  metadata: {
    name: 'PayAI',
    image: 'https://x402scan.com/payai.png',
    docsUrl: 'https://payai.network',
    color: '#9F3EC9',
  },
  config: payai,
  discoveryConfig: payaiDiscovery,
  addresses: {
    [Network.SOLANA]: [
      {
        address: '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-07-01'),
      },
      {
        // Mart.fun treasury address for tracking revenue
        address: 'AHbUXPpSKGzxkD9L3ynbvcdHVGf6LxhaMRg68hx8DpuJ',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-02'),
      },
    ],
    [Network.BASE]: [
      {
        address: '0xc6699d2aada6c36dfea5c248dd70f9cb0235cb63',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-05-18'),
      },
    ],
  },
} as const satisfies Facilitator;
