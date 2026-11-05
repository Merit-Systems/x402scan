import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { FacilitatorConfig, Facilitator } from '../types';

export const agentpay: FacilitatorConfig = {
  url: 'https://x402-agent-pay.com/facilitator',
};

export const agentpayDiscovery: FacilitatorConfig = {
  url: 'https://x402-agent-pay.com/facilitator',
};

export const agentpayFacilitator: Facilitator = {
  id: 'agentpay',
  metadata: {
    name: 'AgentPay',
    image: 'https://agentpaystore.com/agentstore-logo.png',
    docsUrl: 'https://x402-agent-pay.com/facilitator/supported',
    color: '#22d3ee',
  },
  config: agentpay,
  discoveryConfig: agentpayDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xAB1FdA930d4f35085d471CC78C61FbfdAca37b37',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-01'),
      },
    ],
  },
};
