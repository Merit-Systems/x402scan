import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';
import { Network } from '../types';

import type { Facilitator, FacilitatorConfig } from '../types';

export const soon: FacilitatorConfig = {
  url: 'https://facilitator.soo.network/',
};

export const soonFacilitator = {
  id: 'soon',
  metadata: {
    name: 'SOON',
    image: 'https://x402scan.com/soon.png',
    docsUrl: 'https://github.com/soonlabs/faremeter/blob/main/apps/facilitator/README.md',
    color: '#F8F8FF',
  },
  config: soon,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xe4a1e17f764ae9c99318599f3309e81ac8a16d59',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-17'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '34n7XkGa3w7Uc9cmtvj4Vc2aS18LgSQyQ27MgVcrH5X9',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-17'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
