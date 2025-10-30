import { Network, Facilitator, FacilitatorConfig } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

export const mogami: FacilitatorConfig = {
  url: 'https://facilitator.mogami.tech/',
};

export const mogamiFacilitator = {
  id: 'mogami',
  metadata: {
    name: 'Mogami',
    image: 'https://x402scan.com/mogami.png',
    docsUrl: 'https://mogami.tech/',
    color: 'var(--color-green-600)',
  },
  config: mogami,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xfe0920a0a7f0f8a1ec689146c30c3bbef439bf8a',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-24'),
      },
    ],
  },
} as const satisfies Facilitator;
