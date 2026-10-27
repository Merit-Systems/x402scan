import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const roundhouse: FacilitatorConfig = {
  url: 'https://x402.roundhouseai.io',
};

export const roundhouseFacilitator = {
  id: 'roundhouse',
  metadata: {
    name: 'Roundhouse',
    image: 'https://x402scan.com/roundhouse.png',
    docsUrl:
      'https://roundhouseai.io/docs/guides/use-the-roundhouse-facilitator',
    color: '#6FA98A',
  },
  config: roundhouse,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xfac4024325d2960c0fbb1c0f382296182c9620a7',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-10-26'),
      },
      {
        address: '0x6157a191c961290420c68c1aa73c84444d769055',
        deprecated: true,
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-07-10'),
      },
    ],
  },
} as const satisfies Facilitator;
