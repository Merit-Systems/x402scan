import { useWalletClient } from "wagmi";

import {
  x402Client,
  wrapFetchWithPayment,
  registerExactEvmScheme,
  toEvmSigner,
} from "@/lib/x402/wrap-fetch";
import { CHAIN_ID } from "@/types/chain";

import { useX402Fetch } from "./use-fetch";

import type { Chain } from "@/types/chain";

import type { FetchWithPaymentWrapper, UseEvmX402FetchParams } from "./types";

export const useEvmPaymentWrapper = (chain: Chain) => {
  const { data: walletClient } = useWalletClient({
    chainId: CHAIN_ID[chain],
  });

  const wrapperFn: FetchWithPaymentWrapper = (baseFetch) => {
    if (!walletClient?.account) throw new Error("Wallet client not available");

    const client = new x402Client();
    const signer = toEvmSigner(walletClient);
    registerExactEvmScheme(client, { signer });

    return wrapFetchWithPayment(baseFetch, client);
  };

  return { wrapperFn, walletClient };
};

export const useEvmX402Fetch = ({
  chain,
  ...params
}: UseEvmX402FetchParams) => {
  const { wrapperFn } = useEvmPaymentWrapper(chain);

  return useX402Fetch({
    wrapperFn,
    ...params,
  });
};
