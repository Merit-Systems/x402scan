import { Network } from '../types';
import { USDC_BASE_TOKEN } from '../constants';

import type { Facilitator, FacilitatorConfig, Token } from '../types';

// Silverback-specific tokens (addresses must be lowercase)
const BACK_TOKEN: Token = {
  address: '0x558881c4959e9cf961a7e1815fcd6586906babd2',
  decimals: 18,
  symbol: 'BACK',
};

const USDT_BASE_TOKEN: Token = {
  address: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
  decimals: 6,
  symbol: 'USDT',
};

const DAI_BASE_TOKEN: Token = {
  address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
  decimals: 18,
  symbol: 'DAI',
};

const USDBC_TOKEN: Token = {
  address: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca',
  decimals: 6,
  symbol: 'USDbC',
};

const VIRTUAL_TOKEN: Token = {
  address: '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b',
  decimals: 18,
  symbol: 'VIRTUAL',
};

const WETH_BASE_TOKEN: Token = {
  address: '0x4200000000000000000000000000000000000006',
  decimals: 18,
  symbol: 'WETH',
};

const CBBTC_TOKEN: Token = {
  address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
  decimals: 8,
  symbol: 'cbBTC',
};

export const silverback: FacilitatorConfig = {
  url: 'https://facilitator.silverbackdefi.app/',
};

export const silverbackFacilitator = {
  id: 'silverback',
  metadata: {
    name: 'Silverback',
    image: '/silverback.png',
    docsUrl: 'https://docs.silverbackdefi.app/',
    color: '#1A1A1A',
  },
  config: silverback,
  addresses: {
    [Network.BASE]: [
      {
        address: '0x21fded74c901129977b8e28c2588595163e1e235',
        tokens: [
          BACK_TOKEN,
          USDC_BASE_TOKEN,
          USDT_BASE_TOKEN,
          DAI_BASE_TOKEN,
          USDBC_TOKEN,
          VIRTUAL_TOKEN,
          WETH_BASE_TOKEN,
          CBBTC_TOKEN,
        ],
        dateOfFirstTransaction: new Date('2026-02-05'),
      },
    ],
  },
} as const satisfies Facilitator;
