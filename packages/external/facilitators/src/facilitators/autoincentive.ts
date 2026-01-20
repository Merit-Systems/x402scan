import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';
import type { Facilitator, FacilitatorConfig } from '../types';

export const autoincentive: FacilitatorConfig = {
  url: 'https://facilitator.x402endpoints.online',
};

export const autoincentiveFacilitator = {
  id: 'autoincentive',
  metadata: {
    name: 'AutoIncentive',
    image: '/autoincentive.png',
    docsUrl: 'https://github.com/Concorde89/facilitator',
    color: '#4F46E5',
  },
  config: autoincentive,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xdcab6a5ddeb65de28bedd218f9be1dbf5011d02c',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-16'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '9JRPU5K4haWWo1g3WSjCaq283uYcbxvfdEATkaSLw9X8',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-01-16'),
      },
    ],
  },
} as const satisfies Facilitator;
