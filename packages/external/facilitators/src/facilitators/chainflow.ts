import { Network } from '../types';
import { USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const chainflow: FacilitatorConfig = {
  url: 'https://facilitator.chainflow.io',
};

export const chainflowDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.chainflow.io',
};

export const chainflowFacilitator = {
  id: 'chainflow',
  metadata: {
    name: 'Chainflow',
    image: 'https://x402scan.com/chainflow.png',
    docsUrl: 'https://github.com/ChainflowSol/chainflow-facilitator-docs',
    color: '#F2EEEB',
  },
  config: chainflow,
  discoveryConfig: chainflowDiscovery,
  addresses: {
    [Network.SOLANA]: [
      {
        address: 'GeJYAMTSrQ1WgQgewH8SasTAyUFAJheMWEERNEpowRN3',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-05-06'),
      },
    ],
  },
} as const satisfies Facilitator;