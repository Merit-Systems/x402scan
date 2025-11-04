import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const naven: FacilitatorConfig = {
  url: 'https://facilitator.naven.network',
};

export const navenFacilitator = {
  id: 'naven',
  metadata: {
    name: 'Naven',
    image: '/naven.png',
    docsUrl: 'https://docs.naven.network/',
    color: '#9def32',
  },
  config: naven,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x4c8481612eee8bb103a9245158aefde7950113c6',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
    ],
  },
} as const satisfies Facilitator;
