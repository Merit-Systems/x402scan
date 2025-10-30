import { createFacilitator } from '@thirdweb-dev/nexus';

import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { ThirdwebX402FacilitatorConfig } from '@thirdweb-dev/nexus';
import type {
  Facilitator,
  FacilitatorConfig,
  FacilitatorConfigConstructor,
} from '../types';

export const thirdweb: FacilitatorConfigConstructor<ThirdwebX402FacilitatorConfig> =
  createFacilitator;

export const thirdwebDiscovery: FacilitatorConfig = {
  url: 'https://nexus-api.thirdweb.com',
};

export const thirdwebFacilitator = {
  id: 'thirdweb',
  metadata: {
    name: 'Thirdweb',
    image: 'https://x402scan.com/thirdweb.png',
    docsUrl: 'https://nexus.thirdweb.com/docs/facilitator',
    color: '#E91E8C',
  },
  config: thirdweb,
  discoveryConfig: thirdwebDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x80c08de1a05df2bd633cf520754e40fde3c794d3',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-07'),
      },
    ],
  },
} as const satisfies Facilitator<ThirdwebX402FacilitatorConfig>;
