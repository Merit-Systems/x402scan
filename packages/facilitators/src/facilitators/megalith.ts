import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_BSC_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const Megalith: FacilitatorConfig = {
  url: 'https://x402.megalithlabs.ai',
};

export const MegalithFacilitator = {
  id: 'Megalith',
  metadata: {
    name: 'Megalith',
    image: '/megalith.png',
    docsUrl: 'https://x402.megalithlabs.at',
    color: '#f26522',
  },
  config: Megalith,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xa7833325cd012582db1f1be511211e82eddea940',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
    ],
    [Network.BSC]: [
      {
        address: '0xa7833325cd012582db1f1be511211e82eddea940',
        dateOfFirstTransaction: new Date('2025-10-28'),
      },
    ],
  },
} as const satisfies Facilitator;
