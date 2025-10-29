import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../lib/constants';

export const daydreams = {
  id: 'daydreams',
  metadata: {
    name: 'Daydreams',
    image: 'https://x402scan.com/router-logo-small.png',
    docsUrl: 'https://facilitator.daydreams.systems',
    color: 'var(--color-yellow-600)',
  },
  config: {
    url: 'https://facilitator.daydreams.systems',
  },
  addresses: {
    [Chain.BASE]: [
      {
        address: '0x279e08f711182c79Ba6d09669127a426228a4653',
        tokens: [USDC_BASE_TOKEN],
      },
    ],
    [Chain.SOLANA]: [
      {
        address: 'DuQ4jFMmVABWGxabYHFkGzdyeJgS1hp4wrRuCtsJgT9a',
        tokens: [USDC_SOLANA_TOKEN],
      },
    ],
  },
} as const satisfies Facilitator;
