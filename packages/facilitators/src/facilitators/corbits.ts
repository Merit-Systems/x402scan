import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const corbits: FacilitatorConfig = {
  url: 'https://facilitator.corbits.dev',
};

export const corbitsFacilitator = {
  id: 'corbits',
  metadata: {
    name: 'Corbits',
    image: 'https://x402scan.com/corbits.png',
    docsUrl: 'https://corbits.dev',
    color: '#DD903A',
  },
  config: corbits,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'AepWpq3GQwL8CeKMtZyKtKPa7W91Coygh3ropAJapVdU',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-09-21'),
      },
    ],
  },
} as const satisfies Facilitator;
