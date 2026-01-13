import type { UseMutationOptions } from '@tanstack/react-query';
import type { Chain } from '@/types/chain';

export interface X402FetchResponse<TData = unknown> {
  data: TData | string;
  type: 'json' | 'text' | 'unknown';
}

export type FetchWithPaymentWrapper = (
  baseFetch: typeof fetch
) => (url: string, init?: RequestInit) => Promise<Response>;

export interface UseEvmX402FetchParams<TData = unknown> {
  targetUrl: string;
  value: bigint;
  chain: Chain;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  isTool?: boolean;
}
