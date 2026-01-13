import type z from 'zod';

import type { paymentResponseHeaderSchema } from '@/lib/x402/schema';

export interface X402FetchResponse<TData = unknown> {
  data: TData | string;
  type: 'json' | 'text' | 'unknown';
  paymentResponse: z.infer<typeof paymentResponseHeaderSchema> | null;
}

export type FetchWithPaymentWrapper = (
  baseFetch: typeof fetch,
  value: bigint
) => (url: string, init?: RequestInit) => Promise<Response>;
