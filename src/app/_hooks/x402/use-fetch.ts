import { useMutation } from '@tanstack/react-query';
import { useWalletClient } from 'wagmi';
import { wrapFetchWithPayment } from 'x402-fetch';

import {
  createFetchWithProxyHeader,
  PROXY_ENDPOINT,
} from '@/lib/x402/proxy-fetch';

import { useWalletAccountTransactionSigner } from '@solana/react';

import type { UseMutationOptions } from '@tanstack/react-query';
import { useSolana } from '@/app/_contexts/solana';
import { wrapFetchWithSolanaPayment } from '@/lib/x402/solana/fetch-with-payment';

export const useX402Fetch = <TData = unknown>(
  targetUrl: string,
  value: bigint,
  init?: RequestInit,
  options?: Omit<UseMutationOptions<TData>, 'mutationFn'>
) => {
  const { data: walletClient } = useWalletClient({
    chainId: 8453,
  });

  const { selectedAccount } = useSolana();

  const signer = useWalletAccountTransactionSigner(
    selectedAccount!,
    'solana:mainnet'
  );

  return useMutation({
    mutationFn: async () => {
      // if (!walletClient) throw new Error('Wallet client not available');

      const fetchWithProxyHeader = createFetchWithProxyHeader(targetUrl);
      const fetchWithPayment = wrapFetchWithSolanaPayment(
        fetchWithProxyHeader,
        signer,
        1000000000000n
      );

      const response = await fetchWithPayment(PROXY_ENDPOINT, init);

      const contentType = response.headers.get('content-type') ?? '';
      return contentType.includes('application/json')
        ? (response.json() as Promise<TData>)
        : (response.text() as Promise<TData>);
    },
    ...options,
  });
};
