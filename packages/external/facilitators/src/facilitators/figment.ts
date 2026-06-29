import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const figment: FacilitatorConfig = {
  url: 'https://api.figment.io/x402',
};

export const figmentFacilitator = {
  id: 'figment-facilitator',
  metadata: {
    name: 'Figment',
    image: 'https://x402scan.com/figment.svg',
    docsUrl: 'https://docs.figment.io/reference/x402',
    color: '#FFF29B',
  },
  config: figment,
  addresses: {
    [Network.SOLANA]: [
      {
        address: '93syNmtT1tTd5ZtPwHqzGf6CM7fKhMmArpv4AM4FtyNX',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-06-26'),
      },
    ],
  },
} as const satisfies Facilitator;
