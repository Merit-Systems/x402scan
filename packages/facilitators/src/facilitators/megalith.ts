import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_BSC_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const Megalith: FacilitatorConfig = {
  url: 'https://x402.megalithlabs.ai',
};

export const Megalith = {
  id: 'Megalith',
  metadata: {
    name: 'Megalith',
    image: '----',
    docsUrl: 'https://x402.megalithlabs.at',
    color: '#f26522',
  },
  config: Megalith,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xa7833325cd012582dB1f1be511211E82eDDEA940',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
    ],
    [Network.BSC]: [
      {
        address: '0xa7833325cd012582dB1f1be511211E82eDDEA940',
        tokens: [USDC_BSC_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-28'),
      },
    ],
  },
} as const satisfies Facilitator;
