import z from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

import { getOriginFromUrl } from '@/lib/url';
import { parseX402Response } from '@/lib/x402/schema';
import { scrapeOriginData } from '@/services/scraper';

interface FailedResourceDetails {
  success: false;
  url: string;
  error: string;
  status?: number;
  statusText?: string;
  body?: unknown;
}

async function testSingleResource(
  url: string,
  specifiedMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
) {
  let lastError: FailedResourceDetails = {
    success: false,
    url,
    error: 'No valid x402 response found',
  };

  // Use specified method or try GET then POST
  const methodsToTry = specifiedMethod
    ? [specifiedMethod]
    : (['GET', 'POST'] as const);

  for (const method of methodsToTry) {
    try {
      const response = await fetch(url, {
        method,
        headers:
          method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'POST' ? '{}' : undefined,
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });

      const text = await response.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }

      if (response.status !== 402) {
        lastError = {
          success: false,
          url,
          error: `Expected 402, got ${response.status}`,
          status: response.status,
          statusText: response.statusText,
          body,
        };
        continue;
      }

      const parsed = parseX402Response(body);
      if (parsed?.success) {
        const accepts = parsed.data.accepts ?? [];
        const description =
          accepts.find(a => a.description)?.description ?? null;
        return {
          success: true as const,
          url,
          method,
          description,
          parsed: parsed.data,
        };
      } else {
        lastError = {
          success: false,
          url,
          error: 'Invalid x402 response format',
          status: response.status,
          statusText: response.statusText,
          body,
        };
      }
    } catch (err) {
      lastError = {
        success: false,
        url,
        error: err instanceof Error ? err.message : 'Fetch failed',
      };
    }
  }

  return lastError;
}

export const developerRouter = createTRPCRouter({
  preview: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .query(async ({ input }) => {
      // Strip query params to mirror registration flow
      const urlObj = new URL(input.url);
      urlObj.search = '';
      const cleanUrl = urlObj.toString();

      const origin = getOriginFromUrl(cleanUrl);
      const {
        og,
        metadata,
        origin: scrapedOrigin,
      } = await scrapeOriginData(origin);

      const title = metadata?.title ?? og?.ogTitle ?? null;
      const description = metadata?.description ?? og?.ogDescription ?? null;
      const favicon = og?.favicon
        ? new URL(og.favicon, scrapedOrigin).toString()
        : null;
      const ogImages = (og?.ogImage ?? []).map(image => ({
        url: image.url,
        height: image.height,
        width: image.width,
        title: og?.ogTitle,
        description: og?.ogDescription,
      }));

      return {
        preview: {
          title,
          description,
          favicon,
          ogImages,
          origin: scrapedOrigin,
        },
      };
    }),
  test: publicProcedure
    .input(
      z.object({
        method: z.enum(['GET', 'POST']),
        url: z.string().url(),
        headers: z.record(z.string(), z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      const { method, url, headers = {} } = input;

      const response = await fetch(url, {
        method,
        headers:
          method === 'POST'
            ? { ...headers, 'Content-Type': 'application/json' }
            : headers,
        body: method === 'POST' ? '{}' : undefined,
        redirect: 'follow',
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

      const result = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: hdrs,
        body,
      };

      const parsed = parseX402Response(result.body);
      const info = (() => {
        if (!parsed?.success)
          return { hasAccepts: false, hasInputSchema: false };
        const accepts = parsed.data.accepts ?? [];
        const hasAccepts = accepts.length > 0;
        const hasInputSchema = Boolean(
          accepts.find(accept => accept.outputSchema)?.outputSchema?.input
        );
        return { hasAccepts, hasInputSchema };
      })();

      return { result, parsed, info };
    }),

  /** Batch test multiple resources to get their x402 responses */
  batchTest: publicProcedure
    .input(
      z.object({
        resources: z
          .array(
            z.object({
              url: z.string().url(),
              method: z
                .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
                .optional(),
            })
          )
          .max(20),
      })
    )
    .query(async ({ input }) => {
      const results = await Promise.all(
        input.resources.map(r => testSingleResource(r.url, r.method))
      );

      return {
        resources: results.filter(
          (r): r is Extract<typeof r, { success: true }> => r.success
        ),
        failed: results.filter((r): r is FailedResourceDetails => !r.success),
      };
    }),
});
