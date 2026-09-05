import type { Chain, SupportedChain, SupportedEVMChain } from "@/types/chain";
import type z from "zod";
import type { getTokenBalanceSchema, sendTokensSchema } from "./schemas";
import type { SolanaAddress } from "@/types/address";
import type { Address } from "viem";
import type { CdpResultAsync } from "../../result";
import type { ClientEvmSigner } from "@x402/evm";
import type { ClientSvmSigner } from "@x402/svm";

export type NetworkServerWallet<T extends Chain> = (name: string) => {
  address: () => CdpResultAsync<
    T extends Chain.SOLANA ? SolanaAddress : Address
  >;
  getTokenBalance: (
    input: z.infer<typeof getTokenBalanceSchema>
  ) => CdpResultAsync<number>;
  export: () => CdpResultAsync<string>;
  signer: () => Promise<
    T extends Chain.SOLANA ? ClientSvmSigner : ClientEvmSigner
  >;
  sendTokens: (
    input: z.infer<typeof sendTokensSchema>
  ) => CdpResultAsync<string>;
};

export type EvmWallets = {
  [K in SupportedEVMChain]: ReturnType<NetworkServerWallet<K>>;
};

export type Wallets = {
  [K in SupportedChain]: ReturnType<NetworkServerWallet<K>>;
};
