import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const xpay: FacilitatorConfig = {
  url: 'https://facilitator-xpay.llc',
};

export const xpayFacilitator = {
  id: 'xpay',
  metadata: {
    name: 'X Pay',
    image: 'https://x402scan.com/xpay.png',
    docsUrl: 'https://x-pay.llc/docs',
    color: '#91D41E',
  },
  config: xpay,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x589a2314a2e05f45e40c4823da3ba58d421db3d8',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-09-22'),
      },
    ],
  },
} as const satisfies Facilitator;
