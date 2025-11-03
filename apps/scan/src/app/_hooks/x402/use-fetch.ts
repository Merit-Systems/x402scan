import { useMutation } from '@tanstack/react-query';
import { useWalletClient } from 'wagmi';
import { wrapFetchWithPayment } from 'x402-fetch';

import { fetchWithProxy } from '@/lib/x402/proxy-fetch';

import type { UseMutationOptions } from '@tanstack/react-query';

export interface X402FetchResponse<TData = unknown> {
  data: TData | string;
  type: 'json' | 'text' | 'unknown';
}

export const useX402Fetch = <TData = unknown>(
  targetUrl: string,
  value: bigint,
  init?: RequestInit,
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>
) => {
  const { data: walletClient } = useWalletClient({
    chainId: 8453,
  });

  return useMutation({
    mutationFn: async () => {
      if (!walletClient) throw new Error('Wallet client not available');

      const fetchWithPayment = wrapFetchWithPayment(
        fetchWithProxy,
        walletClient as unknown as Parameters<typeof wrapFetchWithPayment>[1],
        value
      );

      const response = await fetchWithPayment(targetUrl, init);

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          return {
            data: (await response.json()) as TData,
            type: 'json' as const,
          };
        } catch {
          return {
            data: await response.text(),
            type: 'unknown' as const,
          };
        }
      } else if (contentType.includes('text/')) {
        return {
          data: await response.text(),
          type: 'text' as const,
        };
      } else {
        return {
          data: await response.text(),
          type: 'unknown' as const,
        };
      }
    },
    ...options,
  });
};
