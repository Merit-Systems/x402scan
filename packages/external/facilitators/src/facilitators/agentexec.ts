import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const agentexec: FacilitatorConfig = {
  url: 'https://agent-exec.448c.org/facilitator',
};

export const agentexecFacilitator = {
  id: 'agent-exec',
  metadata: {
    name: 'agent-exec',
    image: 'https://x402scan.com/agent-exec.svg',
    docsUrl: 'https://agent-exec.448c.org',
    color: '#2DD4BF',
  },
  config: agentexec,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x1e360eff90c58c974de1f8ac6922cadc309dec34',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-08-07'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'HzUdRhSZMrSg5sbPCjToWFGCkSf2yfSE33m5NWaBC4rh',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-09-19'),
      },
    ],
  },
} as const satisfies Facilitator;
