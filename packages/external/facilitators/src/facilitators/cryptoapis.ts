import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const cryptoapis: FacilitatorConfig = {
  url: 'https://ai.cryptoapis.io/x402/merchant',
};

export const cryptoapisFacilitator = {
  id: 'cryptoapis',
  metadata: {
    name: 'CryptoAPIs',
    image: 'https://x402scan.com/cryptoapis.png',
    docsUrl:
      'https://developers.cryptoapis.io/v-2.2024-12-12-175/RESTapis/x402/x402-merchant-facilitator',
    color: '#2C3EE2',
  },
  config: cryptoapis,
  addresses: {
    [Network.SOLANA]: [
      {
        address: '9BDfKHXNvY3pTW8JBDo9UNEv3u2QQx4gF6NkoZfeCKHG',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-10-20'),
      },
    ],
  },
} as const satisfies Facilitator;
