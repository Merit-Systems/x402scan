import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const threews: FacilitatorConfig = {
  url: 'https://three.ws/api/x402-facilitator',
};

export const threewsFacilitator = {
  id: 'three-ws',
  metadata: {
    name: 'three.ws',
    image: 'https://x402scan.com/three-ws.png',
    docsUrl: 'https://three.ws/docs/x402-distribution',
    color: '#8B5CF6',
  },
  config: threews,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'WwwuGbqHrwF5RG89KhUbmRWEvjnRH9k5kVM5p7T3WwW',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-07-16'),
      },
      {
        address: 'GGf9qBhJDCe1UUz4s4Vxq1uPPvcv7UW7sJTuj2Yo5XQj',
        deprecated: true,
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-07-09'),
      },
    ],
  },
} as const satisfies Facilitator;
