import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const algovoi: FacilitatorConfig = {
  url: 'https://api.algovoi.co.uk',
};

export const algovoiFacilitator = {
  id: 'algovoi',
  metadata: {
    name: 'AlgoVoi',
    image: 'https://x402scan.com/algovoi.svg',
    docsUrl: 'https://api.algovoi.co.uk',
    color: '#6366F1',
  },
  config: algovoi,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x7D01d268636c835d9E56164A24A9587D82B8B186',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-05-14'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'GFir5uY6Rrgk3MRSUKSXp2Z5v7x8pum9vn7xjpr8TAGy',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-05-14'),
      },
    ],
  },
} as const satisfies Facilitator;
