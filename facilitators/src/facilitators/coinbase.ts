import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../lib/constants';

import { facilitator } from '@coinbase/x402';

export const coinbase = {
  id: 'coinbase',
  metadata: {
    name: 'Coinbase',
    image: 'https://x402scan.com/coinbase.png',
    docsUrl: 'https://docs.cdp.coinbase.com/x402/welcome',
    color: 'var(--color-primary)',
  },
  config: facilitator,
  discoveryConfig: facilitator,
  addresses: {
    [Chain.BASE]: [
      {
        address: '0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6',
        tokens: [USDC_BASE_TOKEN],
      },
    ],
    [Chain.SOLANA]: [
      {
        address: 'L54zkaPQFeTn1UsEqieEXBqWrPShiaZEPD7mS5WXfQg',
        tokens: [USDC_SOLANA_TOKEN],
      },
    ],
  },
} as const satisfies Facilitator<void>;
