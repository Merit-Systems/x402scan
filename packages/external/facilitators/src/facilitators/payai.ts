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
      {
        address: 'CjNFTjvBhbJJd2B5ePPMHRLx1ELZpa8dwQgGL727eKww',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
      {
        address: '8B5UKhwfAyFW67h58cBkQj1Ur6QXRgwWJJcQp8ZBsDPa',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
    ],
    [Network.BASE]: [
      {
        address: '0xc6699d2aada6c36dfea5c248dd70f9cb0235cb63',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-05-18'),
      },
      {
        address: '0xb2bd29925cbbcea7628279c91945ca5b98bf371b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x25659315106580ce2a787ceec5efb2d347b539c9',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xb8f41cb13b1f213da1e94e1b742ec1323235c48f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xe575fa51af90957d66fab6d63355f1ed021b887b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x03a3f7ce8e21e6f8d9fa14c67d8876b2470dc2f1',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
      {
        address: '0x675707bc7d03089f820c1b7d49f7480083e8f4df',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
      {
        address: '0xf46833d4ac4f0f1405cc05c30edfd86770f721c9',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
      {
        address: '0x2daaef6f941de214bf7d6daf322bc6bc7406accb',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
      {
        address: '0x2fae4026a31f19183947f0a6045ef975ebfa9ca8',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
      {
        address: '0xe299c486066739c4a31609e1268d93229632dd47',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
      {
        address: '0x6ccf245c883f9f3c6caee0687aa61daf7bc96e32',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
      {
        address: '0xaf990eef9846b63d896056050fdc0b28bca9c24b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
      {
        address: '0x489c40fc3c2a19ad8cb275b7dd6aa194e9219c4f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },
      {
        address: '0x9df61a719ddae27c20a63a417271cc2c704654bd',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-12-08'),
      },      
    ],
  },
} as const satisfies Facilitator;
