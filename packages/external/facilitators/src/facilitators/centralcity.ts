import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const centralcity: FacilitatorConfig = {
  url: 'https://centralcity.ai/x402/facilitator',
};

export const centralcityFacilitator = {
  id: 'centralcity',
  metadata: {
    name: 'Central City',
    image: 'https://x402scan.com/centralcity.png',
    docsUrl: 'https://centralcity.ai/docs/x402-facilitator.md',
    color: '#2457F5',
  },
  config: centralcity,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xc8d6bac2ff7182d22c4f316bfff9f713261a6cec',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-10-19'),
      },
      {
        address: '0x023f489781c18f45730cfd0357ecdc064a68bac5',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-10-25'),
      },
    ],
  },
} as const satisfies Facilitator;
