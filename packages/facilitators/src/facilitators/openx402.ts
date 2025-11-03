import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN, USDC_POLYGON_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const openx402: FacilitatorConfig = {
  url: 'https://openx402.ai',
};

export const openx402Facilitator = {
  id: 'openx402',
  metadata: {
    name: 'OpenX402',
    image: 'https://x402scan.com/openx402.png',
    docsUrl: 'https://openx402.ai',
    color: '#E8EFFE',
  },
  config: openx402,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x97316fa4730bc7d3b295234f8e4d04a0a4c093e8',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-16'),
      },
      {
        address: '0x97db9b5291a218fc77198c285cefdc943ef74917',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-16'),
      },
      {
        address: '0x241b91ba395da56B3b6cc816138C20db6c6B37D3',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-11'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '5xvht4fYDs99yprfm4UeuHSLxMBRpotfBtUCQqM3oDNG',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-10-16'),
      },
    ],
    [Network.POLYGON]: [
      {
        address: '0x97316fa4730bc7d3b295234f8e4d04a0a4c093e8',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-01'),
      },
      {
        address: '0x97db9b5291a218fc77198c285cefdc943ef74917',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-01'),
      },
      {
        address: '0x241b91ba395da56B3b6cc816138C20db6c6B37D3',
        tokens: [USDC_POLYGON_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-01'),
      },
    ],
  },
} as const satisfies Facilitator;
