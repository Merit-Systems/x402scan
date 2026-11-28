import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

// Private: it settles the PayStage paid route only and takes no outside
// requests, so no drop-in config is exported for it.
const paystage: FacilitatorConfig = {
  url: 'https://api.paystage.xyz',
};

export const paystageFacilitator = {
  id: 'paystage',
  metadata: {
    name: 'PayStage',
    image: 'https://paystage.xyz/icon-512.png',
    docsUrl: 'https://paystage.xyz/docs',
    color: '#0B1020',
  },
  config: paystage,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x680228D4915ad9f46C1cF72e1D80370b56a42405',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-11-28'),
      },
    ],
  },
} as const satisfies Facilitator;
