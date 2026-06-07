import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const true402: FacilitatorConfig = {
  url: 'https://true402.dev/api',
};

export const true402Facilitator = {
  id: 'true402',
  metadata: {
    name: 'true402',
    image: 'https://true402.dev/favicon.svg',
    docsUrl: 'https://true402.dev',
    color: '#FFB000',
  },
  config: true402,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x0Be1a164E2354875E001bb7Fa4cf9f6d6F0a6Fa6',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-06-01'),
      },
    ],
  },
} as const satisfies Facilitator;
