import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const cascade: FacilitatorConfig = {
  url: 'https://facilitator.cascade.fyi',
};

export const cascadeFacilitator = {
  id: 'cascade',
  metadata: {
    name: 'Cascade',
    image: 'https://x402scan.com/cascade.svg',
    docsUrl: 'https://cascade.fyi',
    color: '#45D6F0',
  },
  config: cascade,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'F2vVvFwrbGHtsBEqFkSkLvsM6SJmDMm7KqhiW2P64WxY',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-03-05'),
      },
    ],
  },
} as const satisfies Facilitator;
