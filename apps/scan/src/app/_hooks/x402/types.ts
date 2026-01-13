export interface X402FetchResponse<TData = unknown> {
  data: TData | string;
  type: 'json' | 'text' | 'unknown';
}

export type FetchWithPaymentWrapper = (
  baseFetch: typeof fetch
) => (url: string, init?: RequestInit) => Promise<Response>;
