import { useWalletClient } from 'wagmi';
import { wrapFetchWithPayment } from 'x402-fetch';

import { useX402Fetch } from './use-fetch';

import { CHAIN_ID } from '@/types/chain';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { FetchWithPaymentWrapper, X402FetchResponse } from './types';
import type { Chain } from '@/types/chain';

export const useEvmX402Fetch = <TData = unknown>(
  targetUrl: string,
  value: bigint,
  chain: Chain,
  init?: RequestInit,
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>
) => {
  const { data: walletClient } = useWalletClient({
    chainId: CHAIN_ID[chain],
  });

  const wrapperFn: FetchWithPaymentWrapper = (baseFetch, value) => {
    if (!walletClient) throw new Error('Wallet client not available');

    return wrapFetchWithPayment(
      baseFetch,
      walletClient as unknown as Parameters<typeof wrapFetchWithPayment>[1],
      value
    );
  };

  return useX402Fetch<TData>(wrapperFn, targetUrl, value, init, options);
};
