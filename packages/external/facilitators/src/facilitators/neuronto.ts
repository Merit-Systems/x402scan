import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const neuronto: FacilitatorConfig = {
  url: 'https://pay.neuronto.com',
};

export const neurontoFacilitator = {
  id: 'neuronto',
  metadata: {
    name: 'Neuronto Payments',
    image: 'https://x402scan.com/neuronto.png',
    docsUrl: 'https://pay.neuronto.com/developers',
    color: '#0B1016',
  },
  config: neuronto,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xb648c75bc8303062bd4a6311808827e08a52c61d',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-09-15'),
      },
    ],
  },
} as const satisfies Facilitator;
