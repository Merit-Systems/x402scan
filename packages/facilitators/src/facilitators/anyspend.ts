import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';
import { Network } from '../types';

import type { Facilitator, FacilitatorConfig } from '../types';

export const anyspend: FacilitatorConfig = {
  url: 'https://mainnet.anyspend.com/x402',
};

export const anyspendDiscovery: FacilitatorConfig = {
  url: 'https://mainnet.anyspend.com/x402',
};

export const anyspendFacilitator = {
  id: 'anyspend',
  metadata: {
    name: 'AnySpend',
    image: 'https://x402scan.com/anyspend.png',
    docsUrl: 'https://docs.b3.fun/anyspend/x402-overview',
    color: '#4299E1',
  },
  config: anyspend,
  discoveryConfig: anyspendDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x179761D9EEd0F0d1599330CC94B0926e68aE87F1',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '34DmdeSbEnng2bmbSj9ActckY49km2HdhiyAwyXZucqP',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-31'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
