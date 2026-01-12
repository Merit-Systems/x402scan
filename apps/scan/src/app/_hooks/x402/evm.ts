import { useWalletClient } from 'wagmi';

import { useX402Fetch } from './use-fetch';

import {
  x402Client,
  wrapFetchWithPayment,
  registerExactEvmScheme,
  toEvmSigner,
} from '@/lib/x402/wrap-fetch';

import { CHAIN_ID } from '@/types/chain';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { FetchWithPaymentWrapper, X402FetchResponse } from './types';
import type { Chain } from '@/types/chain';

interface UseEvmX402FetchParams<TData = unknown> {
  targetUrl: string;
  value: bigint;
  chain: Chain;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
}

export const useEvmX402Fetch = <TData = unknown>({
  chain,
  ...params
}: UseEvmX402FetchParams<TData>) => {
  const { data: walletClient } = useWalletClient({
    chainId: CHAIN_ID[chain],
  });

  const wrapperFn: FetchWithPaymentWrapper = baseFetch => {
    if (!walletClient?.account) throw new Error('Wallet client not available');

    const client = new x402Client();
    registerExactEvmScheme(client, { signer: toEvmSigner(walletClient) });

    return wrapFetchWithPayment(baseFetch, client);
  };

  return useX402Fetch<TData>({
    wrapperFn,
    ...params,
  });
};
