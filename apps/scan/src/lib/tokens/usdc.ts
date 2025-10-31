import { Chain } from '@/types/chain';
import { Token } from '@/types/token';
import { USDC_ADDRESS } from '../utils';

export const usdc = (chain: Chain): Token => ({
  symbol: 'USDC',
  name: 'USD Coin',
  icon: '/usdc.png',
  decimals: 6,
  chain: chain,
  address: USDC_ADDRESS[chain],
});

export const BASE_USDC = usdc(Chain.BASE);
export const SOLANA_USDC = usdc(Chain.SOLANA);
export const POLYGON_USDC = usdc(Chain.POLYGON);
