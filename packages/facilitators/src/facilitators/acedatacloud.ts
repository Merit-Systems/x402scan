import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const acedatacloud: FacilitatorConfig = {
  url: 'https://facilitator.acedata.cloud',
};

export const acedatacloudFacilitator = {
  id: 'acedatacloud',
  metadata: {
    name: 'AceDataCloud',
    image: 'https://x402scan.com/acedatacloud.png',
    docsUrl: 'https://facilitator.acedata.cloud',
    color: '#15D3C8',
  },
  config: acedatacloud,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x302afdd980aaefca3afa8df7222a6002774f6724',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-04'),
      },
    ],
  },
} as const satisfies Facilitator;
