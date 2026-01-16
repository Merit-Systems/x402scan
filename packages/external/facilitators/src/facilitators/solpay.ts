import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const solpay: FacilitatorConfig = {
  url: 'https://x402.solpay.cash',
};

export const solpayFacilitator = {
  id: 'solpay',
  metadata: {
    name: 'SolPay',
    image: 'https://x402scan.com/solpay.png',
    docsUrl: 'https://www.solpay.cash/docs/x402',
    color: '#059669',
  },
  config: solpay,
  addresses: {
    [Network.SOLANA]: [
      {
        address: '86Ts3pgt61316eCC8RR1bHoCgtLdt6BD3imrWXALWKtp',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-16'),
      },
    ],
  },
} as const satisfies Facilitator;
