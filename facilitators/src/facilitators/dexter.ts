import { Network, Facilitator, FacilitatorConfig } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

export const dexter: FacilitatorConfig = {
  url: 'https://facilitator.dexter.cash',
};

export const dexterFacilitator = {
  id: 'dexter',
  metadata: {
    name: 'Dexter',
    image: 'https://x402scan.com/dexter.svg',
    docsUrl: 'https://facilitator.dexter.cash',
    color: 'var(--color-orange-600)',
  },
  config: dexter,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'DEXVS3su4dZQWTvvPnLDJLRK1CeeKG6K3QqdzthgAkNV',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-26'),
      },
    ],
  },
} as const satisfies Facilitator;
