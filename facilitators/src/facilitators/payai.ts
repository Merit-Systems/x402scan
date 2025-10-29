import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../lib/constants';

export const payai = {
  id: 'payAI',
  name: 'PayAI',
  image: 'https://x402scan.com/payai.png',
  link: 'https://payai.network',
  color: 'var(--color-purple-600)',
  addresses: {
    [Chain.SOLANA]: [
      {
        address: '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4',
        token: USDC_SOLANA_TOKEN,
        syncStartDate: new Date('2025-07-01'),
        enabled: true,
      },
    ],
    [Chain.BASE]: [
      {
        address: '0xc6699d2aada6c36dfea5c248dd70f9cb0235cb63',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-05-18'),
        enabled: true,
      },
    ],
  },
} as const satisfies Facilitator;
