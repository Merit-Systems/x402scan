import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const mflo: FacilitatorConfig = {
  url: 'https://api.mflo.ai',
};

export const mfloFacilitator = {
  id: 'mflo',
  metadata: {
    name: 'Mflo',
    image: '/mflo.svg',
    docsUrl: 'https://docs.mflo.ai',
    color: '#5A6B4A',
  },
  config: {
    url: 'https://api.mflo.ai',
  },
  addresses: {
    [Network.BASE]: [
      {
        address: '0x448Ed823E8058b171377de0f42D267417D0E3c1E',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-30'),
      },
    ],
  },
} as const satisfies Facilitator;
