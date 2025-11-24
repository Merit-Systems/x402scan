import { facilitator } from '@coinbase/x402';

import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const polymer: FacilitatorConfig = {
  url: 'https://mainnet.anyspend.com/x402',
};

// TODO: Do we support discovery?
export const polymerFacilitatorDiscovery: FacilitatorConfig = {
  url: 'https://mainnet.anyspend.com/x402',
};

export const polymerFacilitator = {
  id: 'polymer',
  metadata: {
    name: 'Polymer',
    image: 'https://x402scan.com/polymer.png',
    docsUrl: 'https://docs.cdp.coinbase.com/x402/welcome', // TODO: Write up docs for facilitator
    color: '#22a7dd',
  },
  config: polymer,
  discoveryConfig: polymerFacilitatorDiscovery,
  addresses: {
    // TODO: Fix addresses
    [Network.BASE]: [
      {
        address: '0xd9bbe98d78c1309e61c3cd50cd9329dcc29e99df',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-05-05'),
      },
    ]
  },
} as const satisfies Facilitator<void>;
