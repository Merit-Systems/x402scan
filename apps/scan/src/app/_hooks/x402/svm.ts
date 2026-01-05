import { useWalletAccountTransactionSigner } from '@solana/react';

import { useX402Fetch } from './use-fetch';

import { wrapFetchWithPayment } from '@/lib/x402/wrap-fetch';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { FetchWithPaymentWrapper, X402FetchResponse } from './types';
import type { UiWalletAccount } from '@wallet-standard/react';
import type { Signer } from 'x402-fetch';

type UseSvmX402FetchParams<TData = unknown> = {
  targetUrl: string;
  value: bigint;
  account: UiWalletAccount;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
};

export const useSvmX402Fetch = <TData = unknown>({
  account,
  ...params
}: UseSvmX402FetchParams<TData>) => {
  const transactionSigner = useWalletAccountTransactionSigner(
    account,
    'solana:mainnet'
  );

  const wrapperFn: FetchWithPaymentWrapper = (baseFetch, value) => {
    if (!transactionSigner) {
      throw new Error('Solana wallet not available');
    }

    return wrapFetchWithPayment(baseFetch, transactionSigner as Signer, value);
  };

  return useX402Fetch<TData>({
    wrapperFn,
    ...params,
  });
};
