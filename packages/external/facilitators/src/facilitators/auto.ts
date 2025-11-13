import { Network } from '../types';

import type { Facilitator, FacilitatorConfig } from '../types';

export const auto: FacilitatorConfig = {
  url: 'https://facilitators.x402scan.com',
};

export const autoFacilitator = {
  id: 'auto',
  metadata: {
    name: 'Auto',
    image: 'https://x402scan.com/logo.svg',
    docsUrl: 'https://facilitators.x402scan.com',
    color: '#000000',
  },
  config: auto,
  addresses: {
    [Network.BASE]: [],
  },
} as const satisfies Facilitator;
