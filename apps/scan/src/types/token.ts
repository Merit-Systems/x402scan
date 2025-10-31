import { MixedAddress } from './address';
import { Chain } from './chain';

export type Token = {
  symbol: string;
  name: string;
  icon: string;
  address: MixedAddress;
  decimals: number;
  chain: Chain;
};
