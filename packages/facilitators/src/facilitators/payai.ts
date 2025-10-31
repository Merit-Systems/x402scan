import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const payai: FacilitatorConfig = {
  url: 'https://facilitator.payai.network',
};

export const payaiDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.payai.network',
};

export const payaiFacilitator = {
  id: 'payAI',
  metadata: {
    name: 'PayAI',
    image: 'https://x402scan.com/payai.png',
    docsUrl: 'https://payai.network',
    color: '#9F3EC9',
  },
  config: payai,
  discoveryConfig: payaiDiscovery,
  addresses: {
    [Network.SOLANA]: [
      {
        address: '2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-07-01'),
      },
    ],
    [Network.BASE]: [
      {
        address: '0xc6699d2aada6c36dfea5c248dd70f9cb0235cb63',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-05-18'),
      },
      {
        address: '0xB2Bd29925CBbCEA7628279c91945Ca5B98bf371B',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x25659315106580ce2A787CeeC5efB2d347B539C9',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xB8F41cB13b1f213da1E94E1b742ec1323235C48F',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xe575fA51af90957d66FaB6d63355F1eD021b887b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
    ]
  },
} as const satisfies Facilitator;
