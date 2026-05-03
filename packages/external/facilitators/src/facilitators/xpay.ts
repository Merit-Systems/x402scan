import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const xpay: FacilitatorConfig = {
  url: 'https://facilitator.xpay.sh',
};

export const xpayDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.xpay.sh',
};

export const xpayFacilitator = {
  id: 'xpay',
  metadata: {
    name: 'Xpay',
    image: '/xpay.svg',
    docsUrl: 'https://docs.xpay.sh',
    color: '#00DC9C',
  },
  config: xpay,
  discoveryConfig: xpayDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x2772f7f74ac0aca38c6238aa5ece72b27beb8c17',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-04-01'),
      },
    ],
  },
} as const satisfies Facilitator;
