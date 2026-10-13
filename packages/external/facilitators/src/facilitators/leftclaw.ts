import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const leftclaw: FacilitatorConfig = {
  url: 'https://clawd-facilitator.vercel.app/api',
};

export const leftclawFacilitator = {
  id: 'leftclaw',
  metadata: {
    name: 'LeftClaw',
    image: 'https://x402scan.com/leftclaw.png',
    docsUrl: 'https://leftclaw.services/skill.md',
    color: '#e8473c',
  },
  config: leftclaw,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x876dba305dee9535fd747a69b6ced94517d74b25',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-03-27'),
      },
    ],
  },
} as const satisfies Facilitator;
