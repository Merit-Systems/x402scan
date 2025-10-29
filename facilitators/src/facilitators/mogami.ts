import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN } from '../lib/constants';

export const mogami = {
  id: 'mogami',
  metadata: {
    name: 'Mogami',
    image: 'https://x402scan.com/mogami.png',
    docsUrl: 'https://mogami.tech/',
    color: 'var(--color-green-600)',
  },
  config: {
    url: 'https://facilitator.mogami.tech/',
  },
  addresses: {
    [Chain.BASE]: [
      {
        address: '0xfe0920a0a7f0f8a1ec689146c30c3bbef439bf8a',
        tokens: [USDC_BASE_TOKEN],
      },
    ],
  },
} as const satisfies Facilitator;
