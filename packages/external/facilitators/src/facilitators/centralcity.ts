import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const centralcity: FacilitatorConfig = {
  url: 'https://centralcity.ai/api/public/feed/services',
};

export const centralcityFacilitator = {
  id: 'centralcity',
  metadata: {
    name: 'Central City',
    image: 'https://x402scan.com/centralcity.png',
    docsUrl: 'https://centralcity.ai/docs/protocol-fees.md',
    color: '#2563EB',
  },
  config: centralcity,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xc8d6bac2ff7182d22c4f316bfff9f713261a6cec',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-10-19'),
      },
    ],
  },
} as const satisfies Facilitator;
