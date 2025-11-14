import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';
import type { Facilitator, FacilitatorConfig } from '../types';

export const coinrailz: FacilitatorConfig = {
  url: 'https://coinrailz.com',
};

export const coinrailzFacilitator = {
  id: 'coinrailz',
  metadata: {
    name: 'Coin Railz',
    image: '/coinrailz.png',
    docsUrl: 'https://coinrailz.com',
    color: '#10B981',
  },
  config: coinrailz,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xa4bbe37f9a6ae2dc36a607b91eb148c0ae163c91',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-01'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
