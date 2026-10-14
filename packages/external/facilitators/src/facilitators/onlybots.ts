import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const onlybots: FacilitatorConfig = {
  url: 'https://onlybots.shop/facilitator',
};

export const onlybotsFacilitator = {
  id: 'onlybots',
  metadata: {
    name: 'OnlyBots',
    image: '/onlybots.png',
    docsUrl: 'https://onlybots.shop',
    color: '#5eead4',
  },
  config: onlybots,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x76E13CB6d5Eae06A794Ec99C7D1B486E4Cb3Dd54',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-08-22'),
      },
    ],
  },
} as const satisfies Facilitator;
