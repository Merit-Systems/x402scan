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
      },
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
        address: '0x724efafb051f17ae824afcdf3c0368ae312da264',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xa9a54ef09fc8b86bc747cec6ef8d6e81c38c6180',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x4638bc811c93bf5e60deed32325e93505f681576',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xd7d91a42dfadd906c5b9ccde7226d28251e4cd0f',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x4544b535938b67d2a410a98a7e3b0f8f68921ca7',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x59e8014a3b884392fbb679fe461da07b18c1ff81',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xe6123e6b389751c5f7e9349f3d626b105c1fe618',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xf70e7cb30b132fab2a0a5e80d41861aa133ea21b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0x90da501fdbec74bb0549100967eb221fed79c99b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
      {
        address: '0xce7819f0b0b871733c933d1f486533bab95ec47b',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-29'),
      },
    ],
  },
} as const satisfies Facilitator<QuestflowProps>;
