import type { MixedAddress } from './address';
import type { Chain } from './chain';

export type Token = {
  symbol: string;
  name: string;
  icon: string;
  address: MixedAddress;
  decimals: number;
  chain: Chain;
};
