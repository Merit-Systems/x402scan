import { Network } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN, USDC_ALGORAND_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig } from '../types';

export const goplausible: FacilitatorConfig = {
  url: 'https://facilitator.goplausible.xyz',
};

export const goplausibleDiscovery: FacilitatorConfig = {
  url: 'https://facilitator.goplausible.xyz',
};

export const goplausibleFacilitator = {
  id: 'goplausible',
  metadata: {
    name: 'GoPlausible',
    image: 'https://x402scan.com/goplausible.png',
    docsUrl: 'https://facilitator.goplausible.xyz/docs',
    color: '#02de5a',
  },
  config: goplausible,
  discoveryConfig: goplausibleDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x136008978ad053942dcdbe759a0903f5d84966fa',
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-18'),
      },
    ],
    [Network.SOLANA]: [
      {
        address: '8a8fFNfk2AGS7rgVv1BoqPUWnzQuoCrShJV8tSE6RAYi',
        tokens: [USDC_SOLANA_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-18'),
      },
    ],
    [Network.ALGORAND]: [
      {
        address: 'ZMFK2OI7ZBD2U27ISERZC4S6LKM6WMFJPZQ4MYNJDZ2VNBNMBA67RA22AA',
        tokens: [USDC_ALGORAND_TOKEN],
        dateOfFirstTransaction: new Date('2026-02-13'),
      },
    ],
  },
} as const satisfies Facilitator<void>;
