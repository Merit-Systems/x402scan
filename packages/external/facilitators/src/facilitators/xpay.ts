import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const xpay: FacilitatorConfig = {
  url: 'https://chargexpay.com/api/facilitator',
};

export const xpayFacilitator = {
  id: 'xpay',
  metadata: {
    name: 'XPAY',
    image: 'https://chargexpay.com/favicon.png',
    docsUrl: 'https://chargexpay.com',
    color: '#06B6D4',
  },
  config: xpay,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'E1qqqSBuSwNPGKoCnof5g67xM5fDEstiEK3hSPpiHtT3',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-25'),
      },
    ],
  },
} as const satisfies Facilitator;
