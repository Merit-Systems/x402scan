import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN } from '../lib/constants';

export const mogami = {
  id: 'mogami',
  name: 'Mogami',
  image: 'https://x402scan.com/mogami.png',
  link: 'https://mogami.tech/',
  color: 'var(--color-green-600)',
  addresses: {
    [Chain.BASE]: [
      {
        address: '0xfe0920a0a7f0f8a1ec689146c30c3bbef439bf8a',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-24'),
        enabled: true,
      },
    ],
  },
} as const satisfies Facilitator;
