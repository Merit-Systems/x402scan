import { useMutation } from '@tanstack/react-query';
import { useWalletClient } from 'wagmi';
import { wrapFetchWithPayment } from 'x402-fetch';

import {
  createFetchWithProxyHeader,
  PROXY_ENDPOINT,
} from '@/lib/x402/proxy-fetch';

import type { UseMutationOptions } from '@tanstack/react-query';

export const useX402Fetch = <TData = unknown>(
  targetUrl: string,
  value: bigint,
  init?: RequestInit,
  options?: Omit<UseMutationOptions<TData>, 'mutationFn'>
) => {
  const { data: walletClient } = useWalletClient({
    chainId: 8453,
  });

  return useMutation({
    mutationFn: async () => {
      if (!walletClient) throw new Error('Wallet client not available');

      const fetchWithProxyHeader = createFetchWithProxyHeader(targetUrl);
      const fetchWithPayment = wrapFetchWithPayment(
        fetchWithProxyHeader,
        walletClient as unknown as Parameters<typeof wrapFetchWithPayment>[1],
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
