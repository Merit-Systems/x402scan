import { useWalletAccountTransactionSigner } from "@solana/react";

import { useX402Fetch } from "./use-fetch";

import {
  wrapFetchWithPayment,
  registerSvmX402Client,
} from "@/lib/x402/wrap-fetch";
import { env } from "@/env";

import type { UseMutationOptions } from "@tanstack/react-query";
import type { FetchWithPaymentWrapper, X402FetchResponse } from "./types";
import type { UiWalletAccount } from "@wallet-standard/react";

interface UseSvmX402FetchParams {
  targetUrl: string;
  value: bigint;
  account: UiWalletAccount;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse>, "mutationFn">;
  isTool?: boolean;
}

export const useSvmX402Fetch = ({
  account,
  ...params
}: UseSvmX402FetchParams) => {
  const transactionSigner = useWalletAccountTransactionSigner(
    account,
    "solana:mainnet"
  );

  const wrapperFn: FetchWithPaymentWrapper = (baseFetch) => {
    const client = registerSvmX402Client({
      signer: transactionSigner,
      rpcUrl: env.NEXT_PUBLIC_SOLANA_RPC_URL,
    });

    return wrapFetchWithPayment(baseFetch, client);
  };

  return useX402Fetch({
    wrapperFn,
    ...params,
  });
};
