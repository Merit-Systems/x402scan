import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN } from '../lib/constants';

export const thirdweb = {
  id: 'thirdweb',
  name: 'thirdweb',
  image: 'https://x402scan.com/thirdweb.png',
  link: 'https://portal.thirdweb.com/payments/x402/facilitator',
  color: 'var(--color-pink-600)',
  addresses: {
    [Chain.BASE]: [
      {
        address: '0x80c08de1a05df2bd633cf520754e40fde3c794d3',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-07'),
        enabled: true,
      },
    ],
  },
} as const satisfies Facilitator;
