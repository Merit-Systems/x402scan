import { useWalletClient } from 'wagmi';

import { useX402FetchWithPriceConfirmation } from './use-fetch-with-price-confirmation';
import { wrapFetchWithPayment } from '@/lib/x402/wrap-fetch';
import { fetchWithProxy } from '@/lib/x402/proxy-fetch';

import { CHAIN_ID } from '@/types/chain';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { FetchWithPaymentWrapper, X402FetchResponse } from './types';
import type { Chain } from '@/types/chain';
import type { Signer } from 'x402-fetch';

interface UseEvmX402FetchWithConfirmationParams<TData = unknown> {
  targetUrl: string;
  value: bigint;
  chain: Chain;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
}

/**
 * EVM-specific hook for x402 payments with dynamic price confirmation.
 *
 * Wraps useX402FetchWithPriceConfirmation with EVM wallet integration,
 * handling price increases gracefully by prompting for user confirmation.
 */

export const useEvmX402FetchWithConfirmation = <TData = unknown>({
  chain,
  isTool = false,
  ...params
}: UseEvmX402FetchWithConfirmationParams<TData>) => {
  const { data: walletClient } = useWalletClient({
    chainId: CHAIN_ID[chain],
  });

  const wrapperFn: FetchWithPaymentWrapper = (baseFetch, value) => {
    if (!walletClient) throw new Error('Wallet client not available');

    return wrapFetchWithPayment(baseFetch, walletClient as Signer, value);
  };

  return useX402FetchWithPriceConfirmation<TData>({
    wrapperFn,
    fetchFn: isTool ? fetch : fetchWithProxy,
    initialMaxValue: params.value,
    ...params,
  });
};
