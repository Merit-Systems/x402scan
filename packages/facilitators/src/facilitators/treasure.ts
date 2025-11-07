import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';
import type { Facilitator, FacilitatorConfig, Token } from '../types';

const MAGIC_TOKEN: Token = {
  address: '0xf1572d1da5c3cce14ee5a1c9327d17e9ff0e3f43',
  decimals: 18,
  symbol: 'MAGIC',
};

const SMOL_TOKEN: Token = {
  address: '0xa4bbac7ed5bda8ec71a1af5ee84d4c5a737bd875',
  decimals: 18,
  symbol: 'SMOL',
};

const MIO_TOKEN: Token = {
  address: '0xe19e7429ab6c1f9dd391faa88fbb940c7d22f18f',
  decimals: 18,
  symbol: 'MIO',
};

export const treasure: FacilitatorConfig = {
  url: 'https://x402.treasure.lol/facilitator',
};

export const treasureFacilitator = {
  id: 'treasure',
  metadata: {
    name: 'Treasure',
    image: '/treasure.png',
    docsUrl: 'https://x402.treasure.lol/facilitator',
    color: '#DC2626',
  },
  config: treasure,
  addresses: {
    [Network.BASE]: [
      {
        address: '0xe07e9cbf9a55d02e3ac356ed4706353d98c5a618',
        tokens: [USDC_BASE_TOKEN, MAGIC_TOKEN, SMOL_TOKEN, MIO_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-06'),
      },
    ],
  },
} as const satisfies Facilitator;
