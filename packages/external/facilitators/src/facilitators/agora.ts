import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const agora: FacilitatorConfig = {
  url: 'https://www.x402agora.com',
};

export const agoraFacilitator = {
  id: 'agora',
  metadata: {
    name: 'Agora',
    image: '/agora.png',
    docsUrl: 'https://www.x402agora.com',
    color: '#C9A227',
  },
  config: agora,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x5383C9675A027d20f695424781f4eEC5eC59A4eF',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-03-22'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '8vxCUUEAawgUYE64W4rmwbtBPL3VxM6dHuSQMbxiC1rC',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-03-22'),
      },
    ],
  },
} as const satisfies Facilitator;
