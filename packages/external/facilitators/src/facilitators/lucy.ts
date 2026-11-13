import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const lucy: FacilitatorConfig = {
  url: 'https://facilitator.lucymade.com',
};

export const lucyFacilitator = {
  id: 'lucy',
  metadata: {
    name: 'Lucy',
    image: 'https://x402scan.com/lucy.png',
    docsUrl: 'https://facilitator.lucymade.com',
    color: '#E8A33D',
  },
  config: lucy,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xa307368bddc04654b082b894433fbcfcd6fb08e7',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-11-13'),
      },
    ],
  },
} as const satisfies Facilitator;
