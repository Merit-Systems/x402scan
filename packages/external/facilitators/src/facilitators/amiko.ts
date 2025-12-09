import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const amiko: FacilitatorConfig = {
  url: 'https://facilitator.heyamiko.com',
};

export const amikoFacilitator = {
  id: 'amiko',
  metadata: {
    name: 'Amiko',
    image: '/amiko.png',
    docsUrl: 'https://facilitator.heyamiko.com',
    color: '#37768b',
  },
  config: amiko,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x6f26780f7e7e1d3e68afa3161a4680ca6e5276e5',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'EKQvCrdQvJEtSGfoFiHPYfr53wtpPx4SZxHUPMcQZDVr',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
    ],
  },
} as const satisfies Facilitator;
