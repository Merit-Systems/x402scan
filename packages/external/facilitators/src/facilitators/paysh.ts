import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const paysh: FacilitatorConfig = {
  url: 'https://pay.sh',
};

// Solana Foundation's pay.sh facilitator. Settles x402 `upto` and
// `batch-settlement` payments through the payment-channels program
// (CHNLxYvVA28MJP9PrFuDXccuoGXAx7jBacfLEkahyGsX), live on mainnet since
// 2026-06-24.
export const payshFacilitator = {
  id: 'paysh',
  metadata: {
    name: 'pay.sh',
    image: '/paysh.svg',
    docsUrl: 'https://pay.sh/docs',
    color: '#737373',
  },
  config: paysh,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'BcdwLA62UPEAvRn7AWauMUXKtYMXxdLzTPaSQg5tNaFc',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-06-24'),
      },
    ],
  },
} as const satisfies Facilitator;
