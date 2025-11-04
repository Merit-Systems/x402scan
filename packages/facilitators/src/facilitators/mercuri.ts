import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const mercuri: FacilitatorConfig = {
  url: 'https://facilitator.mercuri.finance',
};

export const mercuriDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.mercuri.finance',
};

export const mercuriFacilitator = {
  id: 'mercuri',
  metadata: {
    name: 'Mercuri Finance',
    image: 'https://www.mercuri.finance/240931790.png',
    docsUrl: 'https://docs.mercuri.finance',
    color: '#95d52b',
  },
  config: mercuri,
  discoveryConfig: mercuriDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x5aed85f843496e0e034438a33b66025d8a319359',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '2kQPdFFffYhskzSKX9uBYuDSWEuSphgJrVmcrofvVnMk',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-04'),
      },
    ],
  },
} as const satisfies Facilitator<void>;