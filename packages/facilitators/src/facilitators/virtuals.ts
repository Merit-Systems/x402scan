import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const virtuals: FacilitatorConfig = {
  url: 'https://acpx.virtuals.io/',
};

export const virtualsFacilitator = {
  id: 'virtuals',
  metadata: {
    name: 'Virtual Protocol',
    image: '/virtuals.png',
    docsUrl: 'https://app.virtuals.io',
    color: '#15886D',
  },
  config: virtuals,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x80735b3f7808e2e229ace880dbe85e80115631ca',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
    ],
  },
} as const satisfies Facilitator;
