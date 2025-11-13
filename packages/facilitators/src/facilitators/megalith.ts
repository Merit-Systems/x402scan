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
        address: '-----', // XXXXX
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-16'), // XXXXX
      },
    ],
    [Network.BSC]: [
      {
        address: '5xvht4fYDs99yprfm4UeuHSLxMBRpotfBtUCQqM3oDNG', // XXXXX
        tokens: [USDC_BSC_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-16'), // XXXXX
      },
    ],
  },
} as const satisfies Facilitator;
