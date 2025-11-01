import { USDC_ADDRESS } from '../utils';

import { Chain } from '@/types/chain';

import type { Token } from '@/types/token';

const usdc = (chain: Chain): Token => ({
  symbol: 'USDC',
  name: 'USD Coin',
  icon: '/usdc.png',
  decimals: 6,
  chain: chain,
  address: USDC_ADDRESS[chain],
});

export const BASE_USDC = usdc(Chain.BASE);
