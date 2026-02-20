import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const moltalyzer: FacilitatorConfig = {
  url: 'https://api.moltalyzer.xyz',
};

export const moltalyzerFacilitator = {
  id: 'moltalyzer',
  metadata: {
    name: 'Moltalyzer',
    image: 'https://moltalyzer.xyz/molty.png',
    docsUrl: 'https://api.moltalyzer.xyz/api',
    color: '#FF6B35',
  },
  config: moltalyzer,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xef9aee373ae9efee085fc0e727399a4d96cdbdc6',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-04'),
      },
    ],
  },
} as const satisfies Facilitator;
