import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const clawpay: FacilitatorConfig = {
  url: 'https://claw-pay.org',
};

export const clawpayFacilitator = {
  id: 'claw-pay',
  metadata: {
    name: 'claw-pay',
    image: 'https://clawpay.eu/logo.png',
    docsUrl: 'https://clawpay.eu',
    color: '#7C3AED',
  },
  config: clawpay,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xee94AB6c6c201E6069bB017E4d23200A60f5aB65',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-03-01'),
      },
    ],
  },
} as const satisfies Facilitator;