import { Network } from '../types';
import {
  USDC_BASE_TOKEN,
  USDC_POLYGON_TOKEN,
  USDC_SOLANA_TOKEN,
} from '../constants';

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
    [Network.BASE]: [
      {
        address: '0x06F0BfD2C8f36674DF5cdE852c1eeD8025C268C9',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-09-22'),
      },
    ],
    [Network.POLYGON]: [
      {
        address: '0x06F0BfD2C8f36674DF5cdE852c1eeD8025C268C9',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-24'),
      },
    ],
  },
} as const satisfies Facilitator;
