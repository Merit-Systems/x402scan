import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_POLYGON_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const dexter: FacilitatorConfig = {
  url: 'https://facilitator.dexter.cash',
};

const dexterDiscovery: FacilitatorConfig = {
  url: 'https://x402.dexter.cash',
};

export const dexterFacilitator = {
  id: 'dexter',
  metadata: {
    name: 'Dexter',
    image: 'https://x402scan.com/dexter.svg',
    docsUrl: 'https://dexter.cash/facilitator',
    color: '#DD903A',
  },
  config: dexter,
  discoveryConfig: dexterDiscovery,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'DEXVS3su4dZQWTvvPnLDJLRK1CeeKG6K3QqdzthgAkNV',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-26'),
      },
    ],
    [Network.BASE]: [
      {
        address: '0x40272E2eAc848Ea70db07Fd657D799bD309329C4',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-25'),
      },
    ],
    [Network.POLYGON]: [
      {
        address: '0x40272E2eAc848Ea70db07Fd657D799bD309329C4',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-27'),
      },
    ],
  },
} as const satisfies Facilitator;
