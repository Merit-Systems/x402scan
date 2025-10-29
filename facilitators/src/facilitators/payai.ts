import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../lib/constants';

export const payai = {
  id: 'payAI',
  metadata: {
    name: 'PayAI',
    image: 'https://x402scan.com/payai.png',
    docsUrl: 'https://payai.network',
    color: 'var(--color-purple-600)',
  },
  config: {
    url: 'https://facilitator.payai.network',
  },
  discoveryConfig: {
    url: 'https://facilitator.payai.network',
  },
  addresses: {
    [Chain.SOLANA]: [
      {
        address: '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4',
        tokens: [USDC_SOLANA_TOKEN],
      },
    ],
    [Chain.BASE]: [
      {
        address: '0xc6699d2aada6c36dfea5c248dd70f9cb0235cb63',
        tokens: [USDC_BASE_TOKEN],
      },
    ],
  },
} as const satisfies Facilitator;
