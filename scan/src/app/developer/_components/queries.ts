'use client';

import { api, type RouterOutputs } from '@/trpc/client';

// Use tRPC-inferred type instead of defining a new type below.
export type PreviewResult = RouterOutputs['developer']['preview'];
export type PreviewData = PreviewResult['preview'] | null;

function headersInitToRecord(headersInit: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (headersInit instanceof Headers) {
    headersInit.forEach((v, k) => (out[k] = v));
  } else if (Array.isArray(headersInit)) {
    for (const [k, v] of headersInit) out[k] = v;
  } else if (headersInit) {
    Object.assign(out, headersInit as Record<string, string>);
  }
  return out;
}

export function useTestQuery(
  method: 'GET' | 'POST',
  url: string,
  headersInit: HeadersInit
) {
  return api.developer.test.useQuery(
    { method, url, headers: headersInitToRecord(headersInit) },
    { enabled: false }
  );
}

export function usePreviewQuery(url: string) {
  return api.developer.preview.useQuery({ url }, { enabled: false });
}
