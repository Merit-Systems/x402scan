import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN } from '../lib/constants';


export const f402104 = {
  id: '402104',
  metadata: {
    name: '402104',
    image: '/402104.png',
    docsUrl: 'https://x402.load.network',
    color: 'var(--color-yellow-300)',
  },
  config: {
    url: 'https://x402.load.network',
  },
  addresses: {
    [Chain.BASE]: [
      {
        address: '0x73b2b8df52fbe7c40fe78db52e3dffdd5db5ad07',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
    ],
  },
} as const satisfies Facilitator;

