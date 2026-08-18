import { Network } from '../types';
import { USDC_CELO_TOKEN, USDT_CELO_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const celo: FacilitatorConfig = {
  url: 'https://api.x402.celo.org',
};

export const celoFacilitator = {
  id: 'celo',
  metadata: {
    name: 'x402.celo.org',
    image: 'https://x402scan.com/celo.png',
    docsUrl: 'https://github.com/celo-org/x402-facilitator',
    color: '#FCFF52',
  },
  config: celo,
  addresses: {
    [Network.CELO]: [
      {
        address: '0x0d74d5cefd2e7f24e623330ebe3d8d4cb45ffb48',
        tokens: [USDC_CELO_TOKEN, USDT_CELO_TOKEN],
        dateOfFirstTransaction: new Date('2026-07-01'),
      },
    ],
  },
} as const satisfies Facilitator;
