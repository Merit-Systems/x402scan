import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const bitrefill: FacilitatorConfig = {
  url: 'https://api.bitrefill.com/x402',
};

export const bitrefillFacilitator = {
  id: 'bitrefill',
  metadata: {
    name: 'Bitrefill',
    image: 'https://x402scan.com/bitrefill.png',
    docsUrl: 'https://www.bitrefill.com',
    color: '#002b28',
  },
  config: bitrefill,
  discoveryConfig: bitrefill,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x15e2e2da7539ef1f652aa3c1d6142a535aa3d7ea',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-14'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'PcTZWki36z5Y82TAATKK48XUdfsgmS5oLkw2Ta7vWyK',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-19'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
