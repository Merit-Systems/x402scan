import { Network } from '../types';
import { EURC_BASE_TOKEN, USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const arispay: FacilitatorConfig = {
  url: 'https://facilitator.arispay.app',
};

export const arispayDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.arispay.app',
};

export const arispayFacilitator = {
  id: 'arispay',
  metadata: {
    name: 'ArisPay',
    image: 'https://x402scan.com/arispay.png',
    docsUrl: 'https://facilitator.arispay.app',
    color: '#D4572A',
  },
  config: arispay,
  discoveryConfig: arispayDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xf0afd8bb6ff2bd7be9d98d570bcfc953008d6abb',
        tokens: [USDC_BASE_TOKEN, EURC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-04-22'),
      },
    ],
  },
} as const satisfies Facilitator;
