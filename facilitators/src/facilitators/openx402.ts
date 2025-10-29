import { Chain, Facilitator } from '../types';
import { USDC_BASE_TOKEN, USDC_SOLANA_TOKEN } from '../lib/constants';

export const openx402 = {
  id: 'openx402',
  name: 'OpenX402',
  image: 'https://x402scan.com/openx402.png',
  link: 'https://open.x402.host',
  color: 'var(--color-blue-100)',
  addresses: {
    [Chain.BASE]: [
      {
        address: '0x97316fa4730bc7d3b295234f8e4d04a0a4c093e8',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-16'),
        enabled: true,
      },
      {
        address: '0x97db9b5291a218fc77198c285cefdc943ef74917',
        token: USDC_BASE_TOKEN,
        syncStartDate: new Date('2025-10-16'),
        enabled: true,
      },
    ],
    [Chain.SOLANA]: [
      {
        address: '5xvht4fYDs99yprfm4UeuHSLxMBRpotfBtUCQqM3oDNG',
        token: USDC_SOLANA_TOKEN,
        syncStartDate: new Date('2025-10-16'),
        enabled: true,
      },
    ],
  },
} as const satisfies Facilitator;
