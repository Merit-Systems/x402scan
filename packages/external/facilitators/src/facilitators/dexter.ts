import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

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
        address: 'DeXterR2kQm8AvRHnNPatWkE46TfAcMeBDjb6FySoAb8',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-04-10'),
      },
      {
        address: 'DEXVS3su4dZQWTvvPnLDJLRK1CeeKG6K3QqdzthgAkNV',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-26'),
      },
    ],
    [Network.BASE]: [
      {
        address: '0x402feee072d655b85e08f1751af9ddbd249521f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-04-10'),
      },
      {
        address: '0x40272e2eac848ea70db07fd657d799bd309329c4',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-25'),
      },
    ],
  },
} as const satisfies Facilitator;
