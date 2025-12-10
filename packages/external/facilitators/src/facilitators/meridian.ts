import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const meridian: FacilitatorConfig = {
  url: 'https://api.mrdn.finance',
};

export const meridianFacilitator = {
  id: 'mrdn',
  metadata: {
    name: 'Meridian',
    image: 'https://x402scan.com/meridian.svg',
    docsUrl: 'https://docs.mrdn.finance',
    color: '#34D399',
  },
  config: meridian,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x8e7769d440b3460b92159dd9c6d17302b036e2d6',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-26'),
      },
      {
        address: '0x3210d7b21bfe1083c9dddbe17e8f947c9029a584',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-26'),
      },
    ],
  },
} as const satisfies Facilitator;
