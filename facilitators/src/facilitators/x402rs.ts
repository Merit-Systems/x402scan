import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN, USDC_POLYGON_TOKEN } from '../lib/constants';

export const x402rs = {
  id: 'x402rs',
  metadata: {
    name: 'X402rs',
    image: 'https://x402scan.com/x402rs.png',
    docsUrl: 'https://x402.rs',
    color: 'var(--color-blue-400)',
  },
  config: {
    url: 'https://facilitator.x402.rs',
  },
  addresses: {
    [Chain.POLYGON]: [
      {
        address: '0xd8dfc729cbd05381647eb5540d756f4f8ad63eec',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-04-01'),
      },
    ],
    [Chain.BASE]: [
      {
        address: '0xd8dfc729cbd05381647eb5540d756f4f8ad63eec',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2024-12-05'),
      },
      {
        address: '0x76eee8f0acabd6b49f1cc4e9656a0c8892f3332e',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-26'),
      },
      {
        address: '0x97d38aa5de015245dcca76305b53abe6da25f6a5',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-24'),
      },
      {
        address: '0x0168f80e035ea68b191faf9bfc12778c87d92008',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-24'),
      },
      {
        address: '0x5e437bee4321db862ac57085ea5eb97199c0ccc5',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-24'),
      },
      {
        address: '0xc19829b32324f116ee7f80d193f99e445968499a',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-26'),
      },
    ],
  },
} as const satisfies Facilitator;
