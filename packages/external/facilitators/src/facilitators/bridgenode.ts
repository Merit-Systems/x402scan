import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const bridgenode: FacilitatorConfig = {
  url: 'https://bridgenode.cc',
};

export const bridgenodeFacilitator = {
  id: 'bridgenode',
  metadata: {
    name: 'BridgeNode',
    image: 'https://bridgenode.cc/favicon.ico',
    docsUrl: 'https://bridgenode.cc',
    color: '#6366F1',
  },
  config: bridgenode,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'BHMDv3ri3LBEZjEzJgDZeUiguVX7LmsCstTXbM3dL8rN',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-07-25'),
      },
    ],
  },
} as const satisfies Facilitator;
