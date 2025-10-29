import { Chain, Facilitator } from '../types';
import { USDC_SOLANA_TOKEN } from '../lib/constants';

export const dexter = {
  id: 'dexter',
  metadata: {
    name: 'Dexter',
    image: 'https://x402scan.com/dexter.svg',
    docsUrl: 'https://facilitator.dexter.cash',
    color: 'var(--color-orange-600)',
  },
  config: {
    url: 'https://facilitator.dexter.cash',
  },
  addresses: {
    [Chain.SOLANA]: [
      {
        address: 'DEXVS3su4dZQWTvvPnLDJLRK1CeeKG6K3QqdzthgAkNV',
        tokens: [USDC_SOLANA_TOKEN],
      },
    ],
  },
} as const satisfies Facilitator;
