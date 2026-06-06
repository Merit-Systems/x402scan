import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const wave: FacilitatorConfig = {
  url: 'https://gateway.wave.online/v1/x402/facilitator',
};

export const waveFacilitator = {
  id: 'wave',
  metadata: {
    name: 'WAVE',
    image: 'https://x402scan.com/wave.svg',
    docsUrl: 'https://wave.online/facilitator',
    color: '#00ccf9',
  },
  config: wave,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x637732154238bb79039e0b0e460cb35f20c2c667',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-06-05'),
      },
    ],
  },
} as const satisfies Facilitator;
