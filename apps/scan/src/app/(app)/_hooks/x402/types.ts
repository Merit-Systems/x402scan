import type z from 'zod';

import type { paymentResponseHeaderSchema } from '@/lib/x402/schema';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { Chain } from '@/types/chain';
import type { Connection } from 'wagmi';

export interface X402FetchResponse<TData = unknown> {
  data: TData | string;
  type: 'json' | 'text' | 'unknown';
  paymentResponse: z.infer<typeof paymentResponseHeaderSchema> | null;
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
  connection?: Connection;
}
