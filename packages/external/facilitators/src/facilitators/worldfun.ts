import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const worldfun: FacilitatorConfig = {
  url: 'https://facilitator.world.fun',
};

export const worldfunFacilitator = {
  id: 'worldfun',
  metadata: {
    name: 'WorldFun by AWE',
    image: '/worldfun.svg',
    docsUrl: 'https://docs.awenetwork.ai/awe-ecosystem/world.fun/x402-facilitator',
    color: '#AB824F',
  },
  config: worldfun,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x6cb960c17a623575dd8db626899c0645ed30e3d5',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-20'),
      }
    ],
  },
} as const satisfies Facilitator;
