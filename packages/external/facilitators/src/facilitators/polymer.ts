import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const polymer: FacilitatorConfig = {
  url: 'https://api.polymer.zone/x402/v1',
};

export const polymerFacilitator = {
  id: 'polymer',
  metadata: {
    name: 'Polymer',
    image: 'https://x402scan.com/polymer.png',
    docsUrl: 'https://docs.polymerlabs.org/docs/build/start/', 
    color: '#22a7dd',
  },
  config: polymer,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x66c40946b0dffd04be467e18309857307ecd37cb',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-27'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
