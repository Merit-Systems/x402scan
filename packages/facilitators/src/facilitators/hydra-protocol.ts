import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const hydraProtocol: FacilitatorConfig = {
  url: 'https://api.hydraprotocol.org',
};

export const hydraProtocolDiscovery: FacilitatorConfig = {
  url: 'https://api.hydraprotocol.org',
};

export const hydraProtocolFacilitator = {
  id: 'hydra-protocol',
  metadata: {
    name: 'Hydra Protocol',
    image: 'https://x402scan.com/hydra-protocol.png',
    docsUrl: 'https://hydraprotocol.org/docs',
    color: '#2B9DEE',
  },
  config: hydraProtocol,
  discoveryConfig: hydraProtocolDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xE6d290965e518D3b7ffEa5FAAa415ACbA876d51C',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '4xHq55xBQQysMwfQ4nqVWfFCBU4qowsW6K9bXquZ3Grm',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-03'),
      },
    ],
  },
} as const satisfies Facilitator;

