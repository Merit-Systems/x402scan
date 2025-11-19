import { USDC_ADDRESS } from '../utils';

import type { Chain } from '@/types/chain';
import type { Token } from '@/types/token';

export const usdc = (chain: Chain): Token => ({
  symbol: 'USDC',
  name: 'USD Coin',
  icon: '/usdc.png',
  decimals: 6,
  chain: chain,
  address: USDC_ADDRESS[chain],
});
