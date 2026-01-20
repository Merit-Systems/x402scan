import { useMutation } from '@tanstack/react-query';

import { fetchWithProxy } from '@/lib/x402/proxy-fetch';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { X402FetchResponse, FetchWithPaymentWrapper } from './types';
import { paymentResponseHeaderSchema } from '@/lib/x402/schema';

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
  init,
  options,
  isTool = false,
}: UseX402FetchParams<TData>) => {
  return useMutation({
    mutationFn: async () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b580f9ca-6e18-4c38-9de1-256e6503a55a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apps/scan/src/app/_hooks/x402/use-fetch.ts:26',message:'useX402Fetch mutationFn entry',data:{targetUrl:targetUrl.slice(0,200),isTool,initMethod:init?.method,initBodyType:typeof init?.body,initBodyPreview:typeof init?.body==='string'?init.body.slice(0,120):undefined,initContentType:init?.headers?new Headers(init.headers).get('content-type'):undefined,baseFetch:isTool?'fetch':'fetchWithProxy'},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      const fetchWithPayment = wrapperFn(isTool ? fetch : fetchWithProxy);
      const response = await fetchWithPayment(targetUrl, init);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch: ${response.statusText}`);
      }

      const base64PaymentResponse = response.headers.get('x-payment-response');
      const paymentResponse = base64PaymentResponse
        ? paymentResponseHeaderSchema.safeParse(
            JSON.parse(atob(base64PaymentResponse))
          )
        : null;

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          return {
            data: (await response.json()) as TData,
            type: 'json' as const,
            paymentResponse: paymentResponse?.success
              ? paymentResponse.data
              : null,
          };
        } catch {
          return {
            data: await response.text(),
            type: 'unknown' as const,
            paymentResponse: paymentResponse?.success
              ? paymentResponse.data
              : null,
          };
        }
      } else if (contentType.includes('text/')) {
        return {
          data: await response.text(),
          type: 'text' as const,
          paymentResponse: paymentResponse?.success
            ? paymentResponse.data
            : null,
        };
      } else {
        return {
          data: await response.text(),
          type: 'unknown' as const,
          paymentResponse: paymentResponse?.success
            ? paymentResponse.data
            : null,
        };
      }
    },
    ...options,
  });
};
