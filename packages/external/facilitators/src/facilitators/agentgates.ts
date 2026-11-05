import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfigConstructor } from '../types';

interface AgentgatesProps {
  apiKey: string;
}

export const agentgates: FacilitatorConfigConstructor<AgentgatesProps> = ({
  apiKey,
}) => ({
  url: 'https://api.agentgates.ai/api/paygates',
  createAuthHeaders: () => {
    return Promise.resolve({
      verify: {},
      settle: {
        Authorization: `Bearer ${apiKey}`,
      },
      supported: {},
    });
  },
});

export const agentgatesFacilitator = {
  id: 'agentgates',
  metadata: {
    name: 'Agentgates',
    image: 'https://x402scan.com/agentgates.png',
    docsUrl: 'https://agentgates.ai',
    color: '#82D2F5',
  },
  config: agentgates,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x7bc5ccd04564cdb5350e9d65492b411c6d256e7d',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-08-31'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'DCz4pNVtZWEMFis9Bg2cbRoqRSRPCNtRD7BoSJSDDxNd',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-08-28'),
      },
    ],
  },
} as const satisfies Facilitator<AgentgatesProps>;
