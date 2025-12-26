import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const primer: FacilitatorConfig = {
  url: 'https://x402.primer.systems',
};

export const primerFacilitator = {
  id: 'primer',
  metadata: {
    name: 'Primer',
    image: 'https://x402scan.com/primer.png',
    docsUrl: 'https://github.com/Primer-Systems/x402',
    color: '#6366F1',
  },
  config: primer,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x37dfb4033d5dd98fd335f24d0d42e8fe68d587d6',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-01-01'),
      },
    ],
  },
} as const satisfies Facilitator;
