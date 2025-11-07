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
        address: '0x5d4f08D5c2bb60703284bc06671Eb680fA41B105',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-04'),
      },
    ],
  },
} as const satisfies Facilitator;
