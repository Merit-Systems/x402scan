import type { Chain, SupportedChain, SupportedEVMChain } from '@/types/chain';
import type { Signer } from 'x402-fetch';
import type z from 'zod';
import type { getTokenBalanceSchema, sendTokensSchema } from './schemas';
import type { MixedAddress } from '@/types/address';

export type NetworkServerWallet<T extends Chain> = (name: string) => {
  address: () => Promise<MixedAddress>;
  getTokenBalance: (
    input: z.infer<typeof getTokenBalanceSchema>
  ) => Promise<number>;
  getNativeTokenBalance: () => Promise<number>;
  export: () => Promise<string>;
  signer: () => Promise<Signer>;
  sendTokens: (input: z.infer<typeof sendTokensSchema>) => Promise<string>;
};

export type EvmWallets = {
  [K in SupportedEVMChain]: ReturnType<NetworkServerWallet<K>>;
};

export type Wallets = {
  [K in SupportedChain]: ReturnType<NetworkServerWallet<K>>;
};
