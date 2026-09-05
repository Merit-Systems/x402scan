import { useWalletAccountTransactionSigner } from "@solana/react";

import { useX402FetchWithPriceConfirmation } from "./use-fetch-with-price-confirmation";
import { fetchWithProxy } from "@/lib/x402/proxy-fetch";

import {
  wrapFetchWithPayment,
  registerSvmX402Client,
} from "@/lib/x402/wrap-fetch";
import { env } from "@/env";

import type { UseMutationOptions } from "@tanstack/react-query";
import type { FetchWithPaymentWrapper, X402FetchResponse } from "./types";
import type { UiWalletAccount } from "@wallet-standard/react";

interface UseSvmX402FetchWithConfirmationParams {
  targetUrl: string;
  value: bigint;
  account: UiWalletAccount;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse>, "mutationFn">;
  isTool?: boolean;
}

/**
 * Solana (SVM) specific hook for x402 payments with dynamic price confirmation.
 *
 * Wraps useX402FetchWithPriceConfirmation with Solana wallet integration,
 * handling price increases gracefully by prompting for user confirmation.
 */

export const useSvmX402FetchWithConfirmation = ({
  account,
  isTool = false,
  ...params
}: UseSvmX402FetchWithConfirmationParams) => {
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

  return useX402FetchWithPriceConfirmation({
    wrapperFn,
    fetchFn: isTool ? fetch : fetchWithProxy,
    initialMaxValue: params.value,
    ...params,
  });
};
