import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const ezpath: FacilitatorConfig = {
  url: 'https://ezpath.myezverse.xyz/facilitator',
};

export const ezpathFacilitator = {
  id: 'ezpath',
  metadata: {
    name: 'EZ Path',
    image: 'https://ezpath.myezverse.xyz/og.webp',
    docsUrl: 'https://ezpath.myezverse.xyz',
    color: '#2563EB',
  },
  config: ezpath,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x13dDE704389b1118B20d2BCc6D3Ace749600e2ad',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-05-17'),
      },
    ],
  },
} as const satisfies Facilitator;
