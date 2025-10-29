import { Chain, Facilitator } from '../types';
import { USDC_SOLANA_TOKEN } from '../lib/constants';

export const dexter = {
  id: 'dexter',
  name: 'Dexter',
  image: 'https://x402scan.com/dexter.svg',
  link: 'https://facilitator.dexter.cash',
  color: 'var(--color-orange-600)',
  addresses: {
    [Chain.SOLANA]: [
      {
        address: 'DEXVS3su4dZQWTvvPnLDJLRK1CeeKG6K3QqdzthgAkNV',
        token: USDC_SOLANA_TOKEN,
        syncStartDate: new Date('2025-10-26'),
        enabled: true,
      },
    ],
  },
} as const satisfies Facilitator;
