import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const shinjukustaition: FacilitatorConfig = {
  url: 'https://shinjukustaition.com/api/x402',
};

export const shinjukustaitionFacilitator = {
  id: 'shinjuku-staition',
  metadata: {
    name: 'Shinjuku Shield',
    image: 'https://x402scan.com/shinjuku-staition.png',
    docsUrl: 'https://shinjukustaition.com',
    color: '#D22B23',
  },
  config: shinjukustaition,
  addresses: {
    [Network.SOLANA]: [
      {
        // `exact` fee payer (extra.feePayer in /api/x402/supported)
        address: 'zM8c2oE4QibuKc93sgCpA6i564vDygXGa67S1ag4rX2',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-09-29'),
      },
    ],
  },
} as const satisfies Facilitator;
