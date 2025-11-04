import { useX402Fetch } from './use-fetch';
import { wrapFetchWithSolanaPayment } from '@/lib/x402/solana/fetch-with-payment';

import { useWalletAccountTransactionSigner } from '@solana/react';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { FetchWithPaymentWrapper, X402FetchResponse } from './types';
import type { UiWalletAccount } from '@wallet-standard/react';

export const useSvmX402Fetch = <TData = unknown>(
  targetUrl: string,
  value: bigint,
  account: UiWalletAccount,
  init?: RequestInit,
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>
) => {
  const transactionSigner = useWalletAccountTransactionSigner(
    account,
    'solana:mainnet'
  );

  const wrapperFn: FetchWithPaymentWrapper = (baseFetch, value) => {
    if (!transactionSigner) {
      throw new Error('Solana wallet not available');
    }

    return wrapFetchWithSolanaPayment(baseFetch, transactionSigner, value);
  };

  return useX402Fetch<TData>(wrapperFn, targetUrl, value, init, options);
};
