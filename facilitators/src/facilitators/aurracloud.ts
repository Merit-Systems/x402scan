import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN } from '../lib/constants';

export const aurracloud = {
  id: 'aurracloud',
  name: 'AurraCloud',
  image: 'https://x402scan.com/aurracloud.png',
  link: 'https://x402-facilitator.aurracloud.com',
  color: 'var(--color-gray-600)',
  addresses: {
    [Chain.BASE]: [
      {
        address: '0x222c4367a2950f3b53af260e111fc3060b0983ff',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-05'),
        enabled: true,
      },
      {
        address: '0xb70c4fe126de09bd292fe3d1e40c6d264ca6a52a',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-27'),
        enabled: true,
      },
    ],
  },
} as const satisfies Facilitator;
