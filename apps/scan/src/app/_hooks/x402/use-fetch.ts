import { useMutation } from '@tanstack/react-query';

import { fetchWithProxy } from '@/lib/x402/proxy-fetch';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { X402FetchResponse, FetchWithPaymentWrapper } from './types';

interface UseX402FetchParams<TData = unknown> {
  wrapperFn: FetchWithPaymentWrapper;
  targetUrl: string;
  value: bigint;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
}

export const useX402Fetch = <TData = unknown>({
  wrapperFn,
  targetUrl,
  value,
  init,
  options,
  isTool = false,
}: UseX402FetchParams<TData>) => {
  return useMutation({
    mutationFn: async () => {
      const fetchWithPayment = wrapperFn(
        isTool ? fetch : fetchWithProxy,
        value
      );
      const response = await fetchWithPayment(targetUrl, init);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch: ${response.statusText}`);
      }

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
