import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const bridgenode: FacilitatorConfig = {
  url: 'https://bridgenode.cc',
};

export const bridgenodeDiscovery: FacilitatorConfig = {
  url: 'https://bridgenode.cc',
};

export const bridgenodeFacilitator = {
  id: 'bridgenode',
  metadata: {
    name: 'BridgeNode',
    image: 'https://x402scan.com/bridgenode.jpg',
    docsUrl: 'https://bridgenode.cc',
    color: '#1A5FB4',
  },
  config: bridgenode,
  discoveryConfig: bridgenodeDiscovery,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'BHMDv3ri3LBEZjEzJgDZeUiguVX7LmsCstTXbM3dL8rN',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-08-07'),
      },
    ],
  },
} as const satisfies Facilitator;
