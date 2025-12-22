import { Network } from '../types';
import {
  USDC_BASE_TOKEN,
  USDC_SOLANA_TOKEN,
  USDC_POLYGON_TOKEN,
} from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const ultravioletadao: FacilitatorConfig = {
  url: 'https://facilitator.ultravioletadao.xyz',
};

export const ultravioletadaoDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.ultravioletadao.xyz',
};

export const ultravioletadaoFacilitator = {
  id: 'ultravioletadao',
  metadata: {
    name: 'Ultravioleta DAO',
    image: 'https://x402scan.com/ultravioletadao.png',
    docsUrl: 'https://facilitator.ultravioletadao.xyz',
    color: '#9333EA',
  },
  config: ultravioletadao,
  discoveryConfig: ultravioletadaoDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x103040545ac5031a11e8c03dd11324c7333a13c7',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-30'),
      },
    ],
    [Network.POLYGON]: [
      {
        address: '0x103040545ac5031a11e8c03dd11324c7333a13c7',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-09'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'F742C4VfFLQ9zRQyithoj5229ZgtX2WqKCSFKgH2EThq',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-30'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
