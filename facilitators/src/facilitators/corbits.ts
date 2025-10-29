import { Chain, Facilitator } from '../types';
import { USDC_SOLANA_TOKEN } from '../lib/constants';

export const corbits = {
  id: 'corbits',
  name: 'Corbits',
  image: 'https://x402scan.com/corbits.png',
  link: 'https://corbits.dev',
  color: 'var(--color-orange-600)',
  addresses: {
    [Chain.SOLANA]: [
      {
        address: 'AepWpq3GQwL8CeKMtZyKtKPa7W91Coygh3ropAJapVdU',
        token: USDC_SOLANA_TOKEN,
        syncStartDate: new Date('2025-9-21'),
        enabled: true,
      },
    ],
  },
} as const satisfies Facilitator;
