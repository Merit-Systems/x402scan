'use client';

import { api, type RouterOutputs } from '@/trpc/client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { parseX402Response } from '@/lib/x402/schema';

type TestResult = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
};

// Use tRPC-inferred type instead of defining a new type below.

function analyzeParsed(
  parsed: ReturnType<typeof parseX402Response> | null | undefined
): { hasAccepts: boolean; hasInputSchema: boolean } {
  if (!parsed?.success) return { hasAccepts: false, hasInputSchema: false };
  const accepts = parsed.data.accepts ?? [];
  const hasAccepts = accepts.length > 0;
  const hasInputSchema = Boolean(accepts[0]?.outputSchema?.input);
  return { hasAccepts, hasInputSchema };
}

function buildProxyUrl(method: 'GET' | 'POST', url: string) {
  const share = method === 'GET' ? 'true' : 'false';
  return `/api/proxy?url=${encodeURIComponent(url)}&share_data=${share}&dev=true`;
}

export function useTestQuery(
  method: 'GET' | 'POST',
  url: string,
  headersInit: HeadersInit
): UseQueryResult<
  {
    result: TestResult;
    parsed: ReturnType<typeof parseX402Response>;
    info: { hasAccepts: boolean; hasInputSchema: boolean };
  } | null,
  Error
> {
  return useQuery<
    { result: TestResult } | null,
    Error,
    {
      result: TestResult;
      parsed: ReturnType<typeof parseX402Response>;
      info: { hasAccepts: boolean; hasInputSchema: boolean };
    } | null
  >({
    queryKey: ['developer-test', method, url, headersInit],
    enabled: false,
    queryFn: async ({ signal }) => {
      const proxied = buildProxyUrl(method, url);
      const response = await fetch(proxied, {
        method,
        headers:
          method === 'POST'
            ? { ...headersInit, 'Content-Type': 'application/json' }
            : headersInit,
        body: method === 'POST' ? '{}' : undefined,
        mode: 'cors',
        redirect: 'follow',
        signal,
      });
      const text = await response.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      const hdrs: Record<string, string> = {};
      response.headers.forEach((v, k) => (hdrs[k] = v));
      return {
        result: {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: hdrs,
          body,
        },
      } as { result: TestResult };
    },
    select: data => {
      if (!data) return null;
      const parsed = parseX402Response(data.result.body);
      const info = analyzeParsed(parsed);
      return { ...data, parsed, info } as {
        result: TestResult;
        parsed: ReturnType<typeof parseX402Response>;
        info: { hasAccepts: boolean; hasInputSchema: boolean };
      };
    },
  });
}

type PreviewResult = RouterOutputs['developer']['preview'];
type PreviewData = PreviewResult['preview'] | null;

export function usePreviewQuery(url: string) {
  return api.developer.preview.useQuery({ url }, { enabled: false });
}
