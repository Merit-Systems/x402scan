import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_BINANCE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const megalith: FacilitatorConfig = {
  url: 'https://x402.megalithlabs.ai',
};

export const megalithFacilitator = {
  id: 'megalith',
  metadata: {
    name: 'Megalith',
    image: '/megalith.png',
    docsUrl: 'https://x402.megalithlabs.at',
    color: '#f26522',
  },
  config: megalith,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xa7833325cd012582db1f1be511211e82eddea940',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
    ],
    [Network.BINANCE]: [
      {
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        tokens: [USDC_BINANCE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-28'),
      },
    ],
  },
} as const satisfies Facilitator;