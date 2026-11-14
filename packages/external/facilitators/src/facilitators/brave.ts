import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

// Private: it settles payments for the Brave Search API only and takes no
// outside requests, so no drop-in config is exported for it.
const brave: FacilitatorConfig = {
  url: 'https://brave.com/search/api',
};

export const braveFacilitator = {
  id: 'brave',
  metadata: {
    name: 'Brave',
    image: 'https://x402scan.com/brave.png',
    docsUrl: 'https://brave.com/search/api',
    color: '#FB542B',
  },
  config: brave,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x82732c476121d9bd71b638dc0153397ad822e5a1',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-11-11'),
      },
    ],
  },
} as const satisfies Facilitator;
