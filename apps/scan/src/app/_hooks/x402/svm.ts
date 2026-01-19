import { useWalletAccountTransactionSigner } from '@solana/react';

import { useX402Fetch } from './use-fetch';

import {
  wrapFetchWithPayment,
  registerSvmX402Client,
} from '@/lib/x402/wrap-fetch';
import { env } from '@/env';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { FetchWithPaymentWrapper, X402FetchResponse } from './types';
import type { UiWalletAccount } from '@wallet-standard/react';

interface UseSvmX402FetchParams<TData = unknown> {
  targetUrl: string;
  value: bigint;
  account: UiWalletAccount;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
}

export const useSvmX402Fetch = <TData = unknown>({
  account,
  ...params
}: UseSvmX402FetchParams<TData>) => {
  const transactionSigner = useWalletAccountTransactionSigner(
    account,
    'solana:mainnet'
  );

  const wrapperFn: FetchWithPaymentWrapper = baseFetch => {
    if (!transactionSigner) {
      throw new Error('Solana wallet not available');
    }

    const client = registerSvmX402Client({
      signer: transactionSigner,
      rpcUrl: env.NEXT_PUBLIC_SOLANA_RPC_URL,
    });

    return wrapFetchWithPayment(baseFetch, client);
  };

  return useX402Fetch<TData>({
    wrapperFn,
    ...params,
  });
};
