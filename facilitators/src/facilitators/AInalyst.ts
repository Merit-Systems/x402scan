import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const ainalyst: FacilitatorConfig = {
  url: 'https://facilitator.ainalyst-api.xyz',
};

export const ainalystFacilitator = {
  id: 'ainalyst',
  metadata: {
    name: 'AInalyst',
    image: 'https://x402scan.com/ainalyst.png',
    docsUrl: 'https://facilitator.ainalyst-api.xyz',
    color: 'var(--color-purple-200)',
  },
  config: ainalyst,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x109f3d0ff7ea61b03df26ca7ef0c41765d85ee0b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-28'),
      },
    ],
  },
} as const satisfies Facilitator;
