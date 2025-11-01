import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type {
  Facilitator,
  FacilitatorConfig,
  FacilitatorConfigConstructor,
} from '../types';

interface QuestflowProps {
  apiKey: string;
}

export const questflow: FacilitatorConfigConstructor<QuestflowProps> = ({
  apiKey,
}) => ({
  url: 'https://facilitator.questflow.ai',
  createAuthHeaders: async () => {
    return {
      verify: {
        Authorization: `Bearer ${apiKey}`,
      },
      settle: {
        Authorization: `Bearer ${apiKey}`,
      },
      supported: {
        Authorization: `Bearer ${apiKey}`,
      }
    };
  },
});

export const questflowDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.questflow.ai',
};

export const questflowFacilitator = {
  id: 'questflow',
  metadata: {
    name: 'Questflow',
    image: 'https://assets.questflow.ai/logo.png',
    docsUrl: 'https://facilitator.questflow.ai',
    color: '#0D9488',
  },
  config: questflow,
  discoveryConfig: questflowDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x724eFaFb051F17Ae824aFcDf3C0368AE312da264'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xa9A54eF09Fc8B86Bc747CEC6EF8D6E81c38c6180'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x4638BC811C93bf5e60deEd32325E93505f681576'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xD7D91a42DFAdD906C5B9cCdE7226d28251e4Cd0F'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x4544b535938b67d2A410a98A7e3b0f8F68921cA7'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x59e8014A3b884392fbb679fe461DA07b18c1Ff81'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xE6123E6b389751C5F7E9349F3d626B105C1fe618'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xf70e7Cb30b132FAb2A0a5e80D41861aA133Ea21B'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x90dA501FDBeC74BB0549100967eB221fEd79c99b'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xCE7819f0B0B871733c933d1F486533BAb95Ec47B'.toLowerCase(),
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
    ],
  },
} as const satisfies Facilitator<QuestflowProps>;
