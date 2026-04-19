import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const asterpay: FacilitatorConfig = {
  url: 'https://x402.asterpay.io',
};

export const asterpayFacilitator = {
  id: 'asterpay',
  metadata: {
    name: 'AsterPay',
    image: '/asterpay.png',
    docsUrl: 'https://asterpay.io',
    color: '#6366f1',
  },
  config: asterpay,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xd5f8481d8f25d3966d2010dbf9b47ffbdf745a9e',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-04-14'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
