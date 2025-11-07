import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';
import type { Facilitator, FacilitatorConfig, Token } from '../types';

const MAGIC_TOKEN: Token = {
  address: '0xF1572d1Da5c3CcE14eE5a1c9327d17e9ff0E3f43',
  decimals: 18,
  symbol: 'MAGIC',
};

const SMOL_TOKEN: Token = {
  address: '0xA4Bbac7eD5BdA8Ec71a1aF5ee84d4c5a737bD875',
  decimals: 18,
  symbol: 'SMOL',
};

const MIO_TOKEN: Token = {
  address: '0xE19E7429AB6c1F9dd391FaA88fbb940C7d22f18f',
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
        address: '0xe07E9cBF9A55D02e3aC356Ed4706353d98c5a618',
        tokens: [USDC_BASE_TOKEN, MAGIC_TOKEN, SMOL_TOKEN, MIO_TOKEN],
        dateOfFirstTransaction: new Date('2025-11-06'),
      },
    ],
  },
} as const satisfies Facilitator;
