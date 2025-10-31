import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const codenut: FacilitatorConfig = {
  url: 'https://facilitator.codenut.ai',
};

export const codenutFacilitator = {
  id: 'codenut',
  metadata: {
    name: 'CodeNut',
    image: '/codenut.png',
    docsUrl: 'https://docs.codenut.ai/guides/x402-facilitator',
    color: '#FF6B35',
  },
  config: codenut,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x8d8Fa42584a727488eeb0E29405AD794a105bb9b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x87aF99356d774312B73018b3B6562e1aE0e018C9',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x65058CF664D0D07f68B663B0D4b4f12A5E331a38',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
      {
        address: '0x88E13D4c764a6c840Ce722A0a3765f55A85b327E',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
    ],
  },
} as const satisfies Facilitator;
