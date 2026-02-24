import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const kobaru: FacilitatorConfig = {
  url: 'https://gateway.kobaru.io',
};

export const kobaruDiscovery: FacilitatorConfig = {
  url: 'https://gateway.kobaru.io',
};

export const kobaruFacilitator = {
  id: 'kobaru',
  metadata: {
    name: 'Kobaru',
    image: 'https://x402scan.com/kobaru.svg',
    docsUrl: 'https://www.kobaru.io',
    color: '#7ccf00',
  },
  config: kobaru,
  discoveryConfig: kobaruDiscovery,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'DGPxUsg8CXEAaniz7Qo5jXJpn5oGGBtWKQGcF2Z9XjKi',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-06'),
      },
    ],
    [Network.BASE]: [
      {
        address: '0x67a3176acd5db920747eef65b813b028ad143cdb',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-09'),
      },
    ],
  },
} as const satisfies Facilitator;
