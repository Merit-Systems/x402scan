import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const openfacilitator: FacilitatorConfig = {
  url: 'https://pay.openfacilitator.io',
};

export const openfacilitatorFacilitator = {
  id: 'openfacilitator',
  metadata: {
    name: 'OpenFacilitator',
    image: 'https://x402scan.com/openfacilitator.svg',
    docsUrl: 'https://www.openfacilitator.io',
    color: '#0B64F4',
  },
  config: openfacilitator,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'Hbe1vdFs4EQVVAzcV12muHhr6DEKwrT9roMXGPLxLBLP',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-01'),
      },
    ],
    [Network.BASE]: [
      {
        address: '0x7c766f5fd9ab3dc09acad5ecfacc99c4781efe29',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-05'),
      },
    ],
  },
} as const satisfies Facilitator;
