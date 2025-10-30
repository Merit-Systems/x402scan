import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const xecho: FacilitatorConfig = {
  url: 'https://www.xechoai.xyz',
};

export const xechoFacilitator = {
  id: 'xecho',
  metadata: {
    name: 'xecho',
    image: '/xecho.png',
    docsUrl: 'https://www.xechoai.xyz',
    color: 'var(--color-blue-600)',
  },
  config: {
    url: 'https://www.xechoai.xyz',
  },
  addresses: {
    [Network.BASE]: [
      {
        address: '0x3be45f576696a2fd5a93c1330cd19f1607ab311d',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-16'),
      },
    ],
  },
} as const satisfies Facilitator;
