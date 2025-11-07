import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';
import type { Facilitator, FacilitatorConfig, Token } from '../types';

export const treasure: FacilitatorConfig = {
  url: 'https://x402.treasure.lol/facilitator',
};

export const treasureFacilitator = {
  id: 'treasure',
  metadata: {
    name: 'Treasure',
    image: '/treasure.png',
    docsUrl: 'https://x402.treasure.lol/facilitator',
    color: '#DC2626',
  },
  config: treasure,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xe07e9cbf9a55d02e3ac356ed4706353d98c5a618',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-06'),
      },
    ],
  },
} as const satisfies Facilitator;
