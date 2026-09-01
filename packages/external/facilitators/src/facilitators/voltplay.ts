import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator } from '../types';

export const voltplayFacilitator = {
  id: 'voltplay',
  metadata: {
    name: 'VoltPlay',
    image: '/voltplay-logo-mark.png',
    docsUrl: 'https://voltplayground.xyz/docs',
    color: '#19C37D',
  },
  config: {
    url: 'https://voltplayground.xyz/api/v1/volt-pay-settle',
  },
  addresses: {
    [Network.BASE]: [
      {
        address: '0x304779882e31a4c98c9042bbde1d3c59cc0b1221',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-09-01'),
      },
    ],
  },
} as const satisfies Facilitator;
