import { Network } from '../types';
import { USDC_BINANCE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const aeon: FacilitatorConfig = {
  url: 'https://aeon.xyz/',
};

export const aeonFacilitator = {
  id: 'aeon',
  metadata: {
    name: 'Aeon',
    image: 'https://x402scan.com/aeon.png',
    docsUrl: 'https://aeon-xyz.readme.io/',
    color: '#5CF484',
  },
  config: aeon,
  addresses: {
    [Network.BINANCE]: [
      {
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        tokens: [USDC_BINANCE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-01'),
      },
    ],
  },
} as const satisfies Facilitator;
