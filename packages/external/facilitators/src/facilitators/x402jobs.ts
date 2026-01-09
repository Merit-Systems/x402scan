import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const x402jobs: FacilitatorConfig = {
  url: 'https://pay.x402.jobs',
};

export const x402jobsFacilitator = {
  id: 'x402jobs',
  metadata: {
    name: 'x402 Jobs',
    image: 'https://x402scan.com/x402jobs.svg',
    docsUrl: 'https://www.x402.jobs',
    color: '#14B8A6',
  },
  config: x402jobs,
  addresses: {
    [Network.SOLANA]: [
      {
        address: '561oabzy81vXYYbs1ZHR1bvpiEr6Nbfd6PGTxPshoz4p',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-11'),
      },
    ],
    [Network.BASE]: [
      {
        address: '0x51fec16843e49b99aaf9814e525aee1756e66a62',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-11'),
      },
    ],
  },
} as const satisfies Facilitator;
