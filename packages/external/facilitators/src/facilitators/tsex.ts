import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const tsex: FacilitatorConfig = {
  url: 'https://tse-x-backend.onrender.com',
};

export const tsexFacilitator = {
  id: 'tsex',
  metadata: {
    name: 'TSE-X IoT Network',
    image: 'https://raw.githubusercontent.com/TSE-Sol/tse-assets/main/Transparent%20Logo%20(200%20x%20200%20px).png',
    docsUrl: 'https://tse-sol.github.io/tse-assets/tse-x-demo-interactive.html',
    color: '#8B5CF6',
  },
  config: tsex,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x8469a3A136AE586356bAA89C61191D8E2d84B92f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-01-01'),
      },
    ],
  },
} as const satisfies Facilitator;
