import { Network } from '../types';
import { USDC_STELLAR_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const builtonstellar: FacilitatorConfig = {
  url: 'https://channels.openzeppelin.com/x402',
};

export const builtonstellarFacilitator = {
  id: 'builtonstellar',
  metadata: {
    name: 'Built on Stellar',
    image: 'https://x402scan.com/builtonstellar.png',
    docsUrl:
      'https://developers.stellar.org/docs/build/apps/x402/built-on-stellar',
    color: '#000000',
  },
  config: builtonstellar,
  addresses: {
    [Network.STELLAR]: [
      {
        address: 'GA5SXMFJTUPTZRIEKM6XZLCYOZRMUEE6KGAHL3GXDBG64DYOUIWYIF3M',
        tokens: [USDC_STELLAR_TOKEN],
        dateOfFirstTransaction: new Date('2026-03-06'),
      },
    ],
  },
} as const satisfies Facilitator;
