import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../lib/constants';

export const daydreams = {
  id: 'daydreams',
  name: 'Daydreams',
  image: 'https://x402scan.com/router-logo-small.png',
  link: 'https://facilitator.daydreams.systems',
  color: 'var(--color-yellow-600)',
  addresses: {
    [Chain.BASE]: [
      {
        address: '0x279e08f711182c79Ba6d09669127a426228a4653',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-16'),
        enabled: true,
      },
    ],
    [Chain.SOLANA]: [
      {
        address: 'DuQ4jFMmVABWGxabYHFkGzdyeJgS1hp4wrRuCtsJgT9a',
        token: USDC_SOLANA_TOKEN,
        syncStartDate: new Date('2025-10-16'),
        enabled: true,
      },
    ],
  },
} as const satisfies Facilitator;
