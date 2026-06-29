import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const merktop: FacilitatorConfig = {
  url: 'https://facilitator.merktop.com',
};

export const merktopFacilitator = {
  id: 'merktop',
  metadata: {
    name: 'Merktop',
    image: '/merktop.png',
    docsUrl: 'https://facilitator.merktop.com',
    color: '#b8e92d',
  },
  config: {
    url: 'https://facilitator.merktop.com',
  },
  addresses: {
    [Network.BASE]: [
      {
        address: '0x27a1c43342984362d7198c3b782bbbd39724e5b0',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-06-05'),
      },
    ],
  },
} as const satisfies Facilitator;
