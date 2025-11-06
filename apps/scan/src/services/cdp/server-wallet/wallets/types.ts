import type { Chain, SupportedChain, SupportedEVMChain } from '@/types/chain';
import type { Token } from '@/types/token';
import type { TransactionModifyingSigner } from '@solana/kit';
import type { Signer } from 'x402-fetch';
import z from 'zod';
import { getTokenBalanceSchema, sendTokensSchema } from './schemas';
import { MixedAddress } from '@/types/address';

export type NetworkServerWallet<T extends Chain> = (name: string) => {
  address: () => Promise<MixedAddress>;
  getTokenBalance: (
    input: z.infer<typeof getTokenBalanceSchema>
  ) => Promise<number>;
  getNativeTokenBalance: () => Promise<number>;
  export: () => Promise<string>;
  signer: () => Promise<
    T extends Chain.SOLANA ? TransactionModifyingSigner : Signer
  >;
  sendTokens: (input: z.infer<typeof sendTokensSchema>) => Promise<string>;
};

export type EvmWallets = {
  [K in SupportedEVMChain]: ReturnType<NetworkServerWallet<K>>;
};

export type Wallets = {
  [K in SupportedChain]: ReturnType<NetworkServerWallet<K>>;
};
