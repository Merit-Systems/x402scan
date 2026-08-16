import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const botpay: FacilitatorConfig = {
  url: 'https://facilitator.botpay.network',
};

export const botpayDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.botpay.network',
};

export const botpayFacilitator = {
  id: 'botpay',
  metadata: {
    name: 'BotPay',
    image: 'https://x402scan.com/botpay.png',
    docsUrl: 'https://botpay.network',
    color: '#3F96FF',
  },
  config: botpay,
  discoveryConfig: botpayDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x4af9c96576d17bbd37e17814c040ebc73c12c956',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-08-14'),
      },
    ],
  },
} as const satisfies Facilitator;
