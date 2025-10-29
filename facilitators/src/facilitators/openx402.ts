import { Network, Facilitator, FacilitatorConfig } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

export const openx402: FacilitatorConfig = {
  url: 'https://open.x402.host',
};

export const openx402Facilitator = {
  id: 'openx402',
  metadata: {
    name: 'OpenX402',
    image: 'https://x402scan.com/openx402.png',
    docsUrl: 'https://open.x402.host',
    color: 'var(--color-blue-100)',
  },
  config: openx402,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x97316fa4730bc7d3b295234f8e4d04a0a4c093e8',
        tokens: [USDC_BASE_TOKEN],
      },
      {
        address: '0x97db9b5291a218fc77198c285cefdc943ef74917',
        tokens: [USDC_BASE_TOKEN],
      },
    ],
    [Network.SOLANA]: [
      {
        address: '5xvht4fYDs99yprfm4UeuHSLxMBRpotfBtUCQqM3oDNG',
        tokens: [USDC_SOLANA_TOKEN],
      },
    ],
  },
} as const satisfies Facilitator;
