import { useWalletClient } from 'wagmi';

import { useX402Fetch } from './use-fetch';

import { wrapFetchWithPayment } from '@/lib/x402/wrap-fetch';

import { CHAIN_ID } from '@/types/chain';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { FetchWithPaymentWrapper, X402FetchResponse } from './types';
import type { Chain } from '@/types/chain';
import type { Signer } from 'x402-fetch';

type UseEvmX402FetchParams<TData = unknown> = {
  targetUrl: string;
  value: bigint;
  chain: Chain;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
};

export const useEvmX402Fetch = <TData = unknown>({
  chain,
  ...params
}: UseEvmX402FetchParams<TData>) => {
  const { data: walletClient } = useWalletClient({
    chainId: CHAIN_ID[chain],
  });

  const wrapperFn: FetchWithPaymentWrapper = (baseFetch, value) => {
    if (!walletClient) throw new Error('Wallet client not available');

    return wrapFetchWithPayment(baseFetch, walletClient as Signer, value);
  };

  return useX402Fetch<TData>({
    wrapperFn,
    ...params,
  });
};
