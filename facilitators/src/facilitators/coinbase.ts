import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../lib/constants';

export const coinbase = {
  id: 'coinbase',
  name: 'Coinbase',
  image: 'https://x402scan.com/coinbase.png',
  link: 'https://docs.cdp.coinbase.com/x402/welcome',
  color: 'var(--color-primary)',
  addresses: {
    [Chain.BASE]: [
      {
        address: '0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-05-05'),
        enabled: true,
      },
    ],
    [Chain.SOLANA]: [
      {
        address: 'L54zkaPQFeTn1UsEqieEXBqWrPShiaZEPD7mS5WXfQg',
        token: USDC_SOLANA_TOKEN,
        syncStartDate: new Date('2025-10-24'),
        enabled: true,
      },
    ],
  },
} as const satisfies Facilitator;
