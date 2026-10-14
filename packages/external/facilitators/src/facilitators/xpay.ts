import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfigConstructor } from '../types';

type XPayConfig = { apiKey: string };

export const xpay: FacilitatorConfigConstructor<XPayConfig> = ({ apiKey }) => ({
  url: 'https://facilitator-xpay.llc',
  createAuthHeaders: async () => ({
    verify: { 'X-API-Key': apiKey },
    settle: { 'X-API-Key': apiKey },
    supported: {},
    list: {},
  }),
});

export const xpayFacilitator = {
  id: 'xpay',
  metadata: {
    name: 'X Pay',
    image: 'https://x402scan.com/xpay.png',
    docsUrl: 'https://facilitator-xpay.llc/docs',
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
} as const satisfies Facilitator<XPayConfig>;

