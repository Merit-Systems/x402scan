import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const defibud: FacilitatorConfig = {
  url: 'https://facilitator.defibud.xyz',
};

export const defibudFacilitator = {
  id: 'defibud',
  metadata: {
    name: 'DefiBud',
    image: '/defibud.png',
    docsUrl: 'https://facilitator.defibud.xyz',
    color: '#1d4231',
  },
  config: defibud,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xe3200439fc19944d2f75b1aae0a513b1cfbb9901',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-24'),
      },
    ]
  },
} as const satisfies Facilitator;
