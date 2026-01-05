export type X402FetchResponse<TData = unknown> = {
  data: TData | string;
  type: 'json' | 'text' | 'unknown';
};

export type FetchWithPaymentWrapper = (
  baseFetch: typeof fetch,
  value: bigint
) => (url: string, init?: RequestInit) => Promise<Response>;
