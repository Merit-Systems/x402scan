import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const relai: FacilitatorConfig = {
  url: 'https://facilitator.x402.fi',
};

export const relaiDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.x402.fi',
};

export const relaiFacilitator = {
  id: 'relai',
  metadata: {
    name: 'RelAI',
    image: 'https://x402scan.com/relai.png',
    docsUrl: 'https://relai.fi/relai-facilitator',
    color: '#8B5CF6',
  },
  config: relai,
  discoveryConfig: relaiDiscovery,
  addresses: {
    [Network.SOLANA]: [
      {
        address: '4x4ZhcqiT1FnirM8Ne97iVupkN4NcQgc2YYbE2jDZbZn',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-23'),
      },
    ],
    [Network.BASE]: [
      {
        address: '0x1892f72fdb3a966b2ad8595aa5f7741ef72d6085',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-23'),
      },
    ],
  },
} as const satisfies Facilitator;
