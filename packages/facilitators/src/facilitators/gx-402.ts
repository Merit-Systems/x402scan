import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN, USDC_POLYGON_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const gx402Config: FacilitatorConfig = {
  url: 'https://api.gx402.org',
};

export const gx402Discovery: FacilitatorConfig = {
  url: 'https://api.gx402.org',
};

export const gx402Facilitator = {
  id: 'gx-402',
  metadata: {
    name: 'GX402 Facilitator',
    image: '/gx-402.png',
    docsUrl: 'https://docs.gx402.org/facilitator',
    color: '#01b8da',
  },
  config: gx402Config,
  discoveryConfig: gx402Discovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x7ac350de5528ddd8080693d9466917e128f2360d',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'HKpXdRp9aMk4QB7XfweTqt4pagMjmHkAUTdx5WcGzx8p',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
    ],
    [Network.POLYGON]: [
      {
        address: '0x7ac350de5528ddd8080693d9466917e128f2360d', // Use specific Polygon address if different
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-05'),
      },
    ],
  },
} as const satisfies Facilitator;