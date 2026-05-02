import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const pyrimid: FacilitatorConfig = {
  url: 'https://pyrimid.ai',
};

export const pyrimidFacilitator = {
  id: 'pyrimid',
  metadata: {
    name: 'Pyrimid',
    image: 'https://x402scan.com/pyrimid.png',
    docsUrl: 'https://pyrimid.ai/quickstart',
    color: '#F97316',
  },
  config: pyrimid,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xc949aea380d7b7984806143ddbfe519b03abd68b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-03-18'),
      },
    ],
  },
} as const satisfies Facilitator;
