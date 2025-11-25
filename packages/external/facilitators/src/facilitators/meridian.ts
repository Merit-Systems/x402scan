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
        address: '0x6152935e7fB695d3E7BEceA07e5C1Ce78074F7C0',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-25'),
      },
    ],
  },
} as const satisfies Facilitator;
