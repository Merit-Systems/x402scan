import { useWalletAccountTransactionSigner } from '@solana/react';

import { useX402FetchWithPriceConfirmation } from './use-fetch-with-price-confirmation';
import { wrapFetchWithPayment } from '@/lib/x402/wrap-fetch';
import { fetchWithProxy } from '@/lib/x402/proxy-fetch';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { FetchWithPaymentWrapper, X402FetchResponse } from './types';
import type { UiWalletAccount } from '@wallet-standard/react';
import type { Signer } from 'x402-fetch';

interface UseSvmX402FetchWithConfirmationParams<TData = unknown> {
  targetUrl: string;
  value: bigint;
  account: UiWalletAccount;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
}

/**
 * Solana (SVM) specific hook for x402 payments with dynamic price confirmation.
 *
 * Wraps useX402FetchWithPriceConfirmation with Solana wallet integration,
 * handling price increases gracefully by prompting for user confirmation.
 */

export const useSvmX402FetchWithConfirmation = <TData = unknown>({
  account,
  isTool = false,
  ...params
}: UseSvmX402FetchWithConfirmationParams<TData>) => {
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

  return useX402FetchWithPriceConfirmation<TData>({
    wrapperFn,
    fetchFn: isTool ? fetch : fetchWithProxy,
    initialMaxValue: params.value,
    ...params,
  });
};
