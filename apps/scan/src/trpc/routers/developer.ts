import z from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

import { getOriginFromUrl } from '@/lib/url';
import {
  parseX402Response,
  getOutputSchema,
  extractX402Data,
  getDescription,
  isV2Response,
} from '@/lib/x402';
import { scrapeOriginData } from '@/services/scraper';
import type { FailedResource } from '@/types/batch-test';

type FailedResourceDetails = FailedResource;

async function testSingleResource(url: string) {
  let lastError: FailedResourceDetails = {
    success: false,
    url,
    error: 'No valid x402 response found',
  };

  // Always try both GET and POST to find which method works
  const methodsToTry = ['GET', 'POST'] as const;
  const triedMethods: string[] = [];

  for (const method of methodsToTry) {
    triedMethods.push(method);
    try {
      const response = await fetch(url, {
        method,
        headers:
          method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: method === 'POST' ? '{}' : undefined,
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });

      // Clone response so we can read headers and body separately
      const clonedResponse = response.clone();

      // Extract x402 data (checks Payment-Required header for v2, then body for v1)
      const x402Data = await extractX402Data(clonedResponse);

      // Also read raw body for error reporting
      const text = await response.text();
      let rawBody: unknown = null;
      try {
        rawBody = text ? JSON.parse(text) : null;
      } catch {
        rawBody = text;
      }

      // Capture headers for debugging
      const headers: Record<string, string> = {};
      response.headers.forEach((v, k) => {
        headers[k] = v;
      });

      if (response.status !== 402) {
        lastError = {
          success: false,
          url,
          error: `Expected 402, got ${response.status}`,
          status: response.status,
          statusText: response.statusText,
          headers,
          body: rawBody,
          triedMethods,
        };
        continue;
      }

      const parsed = parseX402Response(x402Data);
      if (parsed?.success) {
        const description = getDescription(parsed.data) ?? null;
        return {
          success: true as const,
          url,
          method,
          description,
          parsed: parsed.data,
        };
      } else {
        // For debugging: include both x402Data and rawBody in error
        const errorBody = isV2Response(x402Data)
          ? { x402Data, rawBody }
          : rawBody;
        lastError = {
          success: false,
          url,
          error: 'Invalid x402 response format',
          status: response.status,
          statusText: response.statusText,
          headers,
          body: errorBody,
          parseErrors: parsed?.errors,
          triedMethods,
        };
      }
    } catch (err) {
      lastError = {
        success: false,
        url,
        error: err instanceof Error ? err.message : 'Fetch failed',
        triedMethods,
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

      const hdrs: Record<string, string> = {};
      response.headers.forEach((v, k) => (hdrs[k] = v));

      const x402Data = await extractX402Data(response);

      const result = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: hdrs,
        body: x402Data,
      };

      const parsed = parseX402Response(x402Data);
      const info = (() => {
        if (!parsed?.success)
          return { hasAccepts: false, hasInputSchema: false };
        const accepts = parsed.data.accepts ?? [];
        const hasAccepts = accepts.length > 0;
        const outputSchema = getOutputSchema(parsed.data);
        const hasInputSchema = Boolean(outputSchema?.input);
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
              /** If true, this resource is invalid and should not be tested */
              invalid: z.boolean().optional(),
              /** Reason why resource is invalid */
              invalidReason: z.string().optional(),
            })
          )
          .max(20),
      })
    )
    .query(async ({ input }) => {
      // Separate invalid resources from valid ones
      const invalidResults: FailedResourceDetails[] = input.resources
        .filter(r => r.invalid)
        .map(r => ({
          success: false as const,
          url: r.url,
          error: r.invalidReason ?? 'Invalid resource format',
        }));

      // Only test valid resources
      const validResources = input.resources.filter(r => !r.invalid);
      const testResults = await Promise.all(
        validResources.map(r => testSingleResource(r.url))
      );

      // Combine test results with invalid results
      const allResults = [...testResults, ...invalidResults];

      return {
        resources: allResults.filter(
          (r): r is Extract<typeof r, { success: true }> => r.success
        ),
        failed: allResults.filter(
          (r): r is FailedResourceDetails => !r.success
        ),
      };
    }),
});
