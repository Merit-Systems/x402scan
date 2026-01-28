import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const openmid: FacilitatorConfig = {
  url: 'https://facilitator.openmid.xyz',
};

export const openmidFacilitator = {
  id: 'openmid',
  metadata: {
    name: 'Openmid',
    image: 'https://x402scan.com/openmid.svg',
    docsUrl: 'https://github.com/open-mid/8004-facilitator',
    color: '#cee9f0',
  },
  config: openmid,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x16e47d275198ed65916a560bab4af6330c36ae09',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-14'),
      },
    ],
  },
} as const satisfies Facilitator;
