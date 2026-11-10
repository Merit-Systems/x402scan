import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const paycall: FacilitatorConfig = {
  url: 'https://paycall.fun',
};

export const paycallFacilitator = {
  id: 'paycall',
  metadata: {
    name: 'paycall',
    image: 'https://x402scan.com/paycall.png',
    docsUrl: 'https://paycall.fun',
    color: '#FFB800',
  },
  config: paycall,
  addresses: {
    [Network.SOLANA]: [
      {
        address: '2SdsLNH6y29AWuGwLzJ4yzwjXJnA1d6tXrsyHNRH7c6X',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-11-06'),
      },
    ],
  },
} as const satisfies Facilitator;
