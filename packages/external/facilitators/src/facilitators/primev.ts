import { Network } from '../types';
import { USDC_ETHEREUM_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const primev: FacilitatorConfig = {
  url: 'https://facilitator.primev.xyz',
};

export const primevFacilitator = {
  id: 'primev',
  metadata: {
    name: 'Primev FastRPC',
    image: 'https://x402scan.com/primev.svg',
    docsUrl: 'https://primev.xyz',
    color: '#E97D25',
  },
  config: primev,
  addresses: {
    [Network.ETHEREUM]: [
      {
        address: '0x488d87a9A88a6A878B3E7cf0bEece8984af9518D',
        tokens: [USDC_ETHEREUM_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-29'),
      },
    ],
  },
} as const satisfies Facilitator;
