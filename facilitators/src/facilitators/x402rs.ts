import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN, USDC_POLYGON_TOKEN } from '../lib/constants';

export const x402rs = {
  id: 'x402rs',
  name: 'X402rs',
  image: 'https://x402scan.com/x402rs.png',
  link: 'https://x402.rs',
  color: 'var(--color-blue-400)',
  addresses: {
    [Chain.POLYGON]: [
      {
        address: '0xd8dfc729cbd05381647eb5540d756f4f8ad63eec',
        token: USDC_POLYGON_TOKEN,
        syncStartDate: new Date('2025-04-01'),
        enabled: false,
      },
    ],
    [Chain.BASE]: [
      {
        address: '0xd8dfc729cbd05381647eb5540d756f4f8ad63eec',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2024-12-05'),
        enabled: true,
      },
      {
        address: '0x76eee8f0acabd6b49f1cc4e9656a0c8892f3332e',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-26'),
        enabled: true,
      },
      {
        address: '0x97d38aa5de015245dcca76305b53abe6da25f6a5',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-24'),
        enabled: true,
      },
      {
        address: '0x0168f80e035ea68b191faf9bfc12778c87d92008',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-24'),
        enabled: true,
      },
      {
        address: '0x5e437bee4321db862ac57085ea5eb97199c0ccc5',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-24'),
        enabled: true,
      },
      {
        address: '0xc19829b32324f116ee7f80d193f99e445968499a',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-26'),
        enabled: true,
      },
    ],
  },
} as const satisfies Facilitator;
