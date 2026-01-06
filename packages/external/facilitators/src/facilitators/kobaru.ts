import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const kobaru: FacilitatorConfig = {
  url: 'https://gateway.kobaru.io',
};

export const kobaruFacilitator = {
  id: 'kobaru',
  metadata: {
    name: 'Kobaru',
    image: 'https://kobaru.io/icon.svg',
    docsUrl: 'https://docs.kobaru.io',
    color: '#7CCF00',
  },
  config: kobaru,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'DGPxUsg8CXEAaniz7Qo5jXJpn5oGGBtWKQGcF2Z9XjKi',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-06'),
      },
    ],
  },
} as const satisfies Facilitator;
