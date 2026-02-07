import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const kamiyo: FacilitatorConfig = {
  url: 'https://x402.kamiyo.ai',
};

export const kamiyoDiscovery: FacilitatorConfig = {
  url: 'https://x402.kamiyo.ai',
};

export const kamiyoFacilitator = {
  id: 'kamiyo',
  metadata: {
    name: 'KAMIYO',
    image: 'https://kamiyo.ai/logo.png',
    docsUrl: 'https://kamiyo.ai',
    color: '#6366F1',
  },
  config: kamiyo,
  discoveryConfig: kamiyoDiscovery,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'Cti3TCvSX1gXxR9XUWszghwETYUKFEGnuLAvMV4hsMLD',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-07'),
      },
    ],
    [Network.BASE]: [
      {
        address: '0x6448D7772CF9dBd6112AE14176eE5E447A040a45',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-07'),
      },
    ],
  },
} as const satisfies Facilitator;
