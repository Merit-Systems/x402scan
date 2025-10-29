import { Network, Facilitator, FacilitatorConfig } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../constants';

import { facilitator } from '@coinbase/x402';

export const coinbase: FacilitatorConfig = facilitator;
export const coinbaseDiscovery: FacilitatorConfig = facilitator;

export const coinbaseFacilitator = {
  id: 'coinbase',
  metadata: {
    name: 'Coinbase',
    image: 'https://x402scan.com/coinbase.png',
    docsUrl: 'https://docs.cdp.coinbase.com/x402/welcome',
    color: 'var(--color-primary)',
  },
  config: coinbase,
  discoveryConfig: coinbaseDiscovery,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6',
        tokens: [USDC_BASE_TOKEN],
      },
    ],
    [Network.SOLANA]: [
      {
        address: 'L54zkaPQFeTn1UsEqieEXBqWrPShiaZEPD7mS5WXfQg',
        tokens: [USDC_SOLANA_TOKEN],
      },
    ],
  },
} as const satisfies Facilitator<void>;
