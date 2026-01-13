import { useWalletClient } from 'wagmi';

import { useX402Fetch } from './use-fetch';

import {
  x402Client,
  wrapFetchWithPayment,
  registerExactEvmScheme,
  toEvmSigner,
} from '@/lib/x402/wrap-fetch';

import { CHAIN_ID } from '@/types/chain';

import type { FetchWithPaymentWrapper, UseEvmX402FetchParams } from './types';
import type { Chain } from '@/types/chain';

export const useEvmPaymentWrapper = (chain: Chain) => {
  const { data: walletClient } = useWalletClient({
    chainId: CHAIN_ID[chain],
  });

  const wrapperFn: FetchWithPaymentWrapper = baseFetch => {
    if (!walletClient?.account) throw new Error('Wallet client not available');

    const client = new x402Client();
    const signer = toEvmSigner(
      walletClient as Parameters<typeof toEvmSigner>[0]
    );
    registerExactEvmScheme(client, { signer });

    return wrapFetchWithPayment(baseFetch, client);
  };

  return { wrapperFn, walletClient };
};

export const useEvmX402Fetch = <TData = unknown>({
  chain,
  ...params
}: UseEvmX402FetchParams<TData>) => {
  const { wrapperFn } = useEvmPaymentWrapper(chain);

  return useX402Fetch<TData>({
    wrapperFn,
    ...params,
  });
};
