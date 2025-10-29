import { Chain, Facilitator } from '../types';
import { USDC_SOLANA_TOKEN } from '../lib/constants';

export const corbits = {
  id: 'corbits',
  metadata: {
    name: 'Corbits',
    image: 'https://x402scan.com/corbits.png',
    docsUrl: 'https://corbits.dev',
    color: 'var(--color-orange-600)',
  },
  config: {
    url: 'https://facilitator.corbits.dev',
  },
  addresses: {
    [Chain.SOLANA]: [
      {
        address: 'AepWpq3GQwL8CeKMtZyKtKPa7W91Coygh3ropAJapVdU',
        tokens: [USDC_SOLANA_TOKEN],
      },
    ],
  },
} as const satisfies Facilitator;
