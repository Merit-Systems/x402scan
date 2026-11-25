import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const agentpay: FacilitatorConfig = {
  url: 'https://x402-agent-pay.com/facilitator',
};

export const agentpayFacilitator = {
  id: 'agentpay',
  metadata: {
    name: 'AgentPay',
    image: 'https://x402scan.com/agentpay.png',
    docsUrl: 'https://x402-agent-pay.com/facilitator/supported',
    color: '#22d3ee',
  },
  config: agentpay,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xAB1FdA930d4f35085d471CC78C61FbfdAca37b37',
        tokens: [USDC_BASE_TOKEN],
        // First settle on this rail, from the facilitator's own receipts table.
        dateOfFirstTransaction: new Date('2026-08-29'),
      },
    ],
  },
} as const satisfies Facilitator;
