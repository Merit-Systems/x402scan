import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const payzilla: FacilitatorConfig = {
  url: 'https://api-mainnet.payzilla.ai',
};

export const payzillaFacilitator = {
  id: 'payzilla',
  metadata: {
    name: 'Payzilla',
    image: 'https://x402scan.com/payzilla.png',
    docsUrl: 'https://payzilla.ai/developers/',
    color: '#1F45D6',
  },
  config: payzilla,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'CE9TKZjh9yQY1NtdZ3MJUByaN41E49NRt1QE4DQW8M1f',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-10-09'),
      },
    ],
  },
} as const satisfies Facilitator;
