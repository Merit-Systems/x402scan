import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const obolos: FacilitatorConfig = {
  url: 'https://obolos-facilitator-production.up.railway.app',
};

export const obolosFacilitator = {
  id: 'obolos',
  metadata: {
    name: 'Obolos',
    image: 'https://x402scan.com/obolos.png',
    docsUrl: 'https://obolos.tech',
    color: '#0891B2',
  },
  config: obolos,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x0324824fd65b622b5476270547770eb8099e0d7d',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-01'),
      },
    ],
  },
} as const satisfies Facilitator;
