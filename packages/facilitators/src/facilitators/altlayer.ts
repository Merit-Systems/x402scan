import { USDC_BASE_TOKEN } from '../constants';
import { Network } from '../types';

import type { Facilitator, FacilitatorConfig } from '../types';

export const altlayer: FacilitatorConfig = {
  url: 'https://facilitator.altlayer.io',
};

export const altlayerFacilitator = {
  id: 'altlayer',
  metadata: {
    name: 'AltLayer',
    image: 'https://x402scan.com/altlayer.png',
    docsUrl: 'https://altlayer.io',
    color: '#6366F1',
  },
  config: altlayer,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x5A6A78C40d163685Bf54cB4aB1460878b704D095',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-27'),
      },
      {
        address: '0xc5aae2738528f3e362950AE368C0fB4268Cec4Be',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-27'),
      },
    ],
  },
} as const satisfies Facilitator;
