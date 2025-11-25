import { Network } from '../types';
import { USDC_BNB_TOKEN, USDT_BNB_TOKEN, USD1_BNB_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const b402: FacilitatorConfig = {
  url: 'https://facilitator.b402.ai',
};

export const b402Facilitator = {
  id: 'b402',
  metadata: {
    name: 'B402',
    image: 'https://x402scan.com/router-logo-small.png',
    docsUrl: 'https://facilitator.daydreams.systems',
    color: '#D4A62A',
  },
  config: b402,
  addresses: {
    [Network.BNB]: [
      {
        address: '0xE1C2830d5DDd6B49E9c46EbE03a98Cb44CD8eA5a',
        tokens: [USDC_BNB_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-26'),
      },
    ],
    [Network.BNB]: [
      {
        address: '0xE1C2830d5DDd6B49E9c46EbE03a98Cb44CD8eA5a',
        tokens: [USD1_BNB_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-26'),
      },
    ],
    [Network.BNB]: [
      {
        address: '0xE1C2830d5DDd6B49E9c46EbE03a98Cb44CD8eA5a',
        tokens: [USDT_BNB_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-26'),
      },
    ]
  },
} as const satisfies Facilitator;
