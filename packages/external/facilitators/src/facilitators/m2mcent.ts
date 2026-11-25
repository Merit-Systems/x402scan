import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const m2mcent: FacilitatorConfig = {
  url: 'https://api.m2mcent.com',
};

export const m2mcentDiscovery: FacilitatorConfig = {
  url: 'https://api.m2mcent.com',
};

export const m2mcentFacilitator = {
  id: 'm2mcent',
  metadata: {
    name: 'M2MCent',
    image: 'https://x402scan.com/m2mcent.png',
    docsUrl: 'https://m2mcent.com/paywall',
    color: '#00FF88',
  },
  config: m2mcent,
  discoveryConfig: m2mcentDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x704E000b518c6Cf928637eDDCaDD3d15da8773E2',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-11-19'),
      },
      {
        address: '0x67227069f2728d1EE0DfCeDA39B083329303c993',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-11-19'),
      },
    ],
  },
} as const satisfies Facilitator;
