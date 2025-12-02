import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const polymer: FacilitatorConfig = {
  url: 'https://api.polymer.zone/v1/x402',
};

export const polymerFacilitator = {
  id: 'polymer',
  metadata: {
    name: 'Polymer',
    image: 'https://x402scan.com/polymer.png',
    docsUrl: '', // TODO: Write up docs for facilitator
    color: '#22a7dd',
  },
  config: polymer,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xd9bbe98d78c1309e61c3cd50cd9329dcc29e99df',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-27'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
