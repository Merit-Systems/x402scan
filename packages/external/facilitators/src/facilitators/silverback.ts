import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const silverback: FacilitatorConfig = {
  url: 'https://facilitator.silverbackdefi.app/',
};

export const silverbackDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.silverbackdefi.app/',
};

export const silverbackFacilitator = {
  id: 'silverback',
  metadata: {
    name: 'Silverback',
    image: '/silverback.png',
    docsUrl: 'https://docs.silverbackdefi.app/',
    color: '#1A1A1A',
  },
  config: silverback,
  discoveryConfig: silverbackDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x48380bcf1c09773c9e96901f89a7a6b75e2bbecc',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-07'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'CiFihYLDLZYE92R5FtyHt1YaWiVpv6FJUg1wBjQGEAMQ',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-07'),
      },
    ],
  },
} as const satisfies Facilitator;
