import z from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

import { getOriginFromUrl } from '@/lib/url';
import { scrapeOriginData } from '@/services/scraper';
import type { FailedResource, TestedResource } from '@/types/batch-test';
import { probeX402Endpoint } from '@/lib/discovery/probe';
import { validateResource } from '@/lib/resources';
import { fetchDiscoveryDocument } from '@/services/discovery';

/**
 * Test a single resource by probing it and running the same validation
 * that registerResource() uses (via shared validateResource()). This
 * ensures the batch-test count matches the actual registration outcome.
 */
async function testSingleResource(
  url: string,
  method?: string,
  sampleBody?: string
) {
  try {
    let parsedSampleBody: Record<string, unknown> | undefined;
    if (sampleBody) {
      try {
        const parsed: unknown = JSON.parse(sampleBody);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          return {
            success: false as const,
            url,
            error: 'Sample body must be a JSON object (e.g. {"key": "value"})',
          };
        }
        parsedSampleBody = parsed as Record<string, unknown>;
      } catch (e) {
        const message = e instanceof SyntaxError ? e.message : 'Invalid JSON';
        return {
          success: false as const,
          url,
          error: `Invalid JSON in sample body: ${message}`,
        };
      }
    }

    const result = await probeX402Endpoint(url, method, parsedSampleBody);

    if (!result.success) {
      return {
        success: false as const,
        url,
        error: result.error,
        ...(result.skipped ? { skipped: true as const } : {}),
        ...(result.statusCode ? { statusCode: result.statusCode } : {}),
      };
    }

    const { advisory } = result;

    // Run the same validation as registerResource()
    const validation = validateResource(url, advisory);
    if (!validation.valid) {
      return {
        success: false as const,
        url,
        error: validation.error,
      };
    }

    return {
      success: true as const,
      url,
      method: advisory.method as TestedResource['method'],
      description: advisory.summary ?? null,
      parsed: advisory,
      warnings: [...result.warnings, ...validation.warnings],
    };
  } catch (err) {
    return {
      success: false as const,
      url,
      error: err instanceof Error ? err.message : 'Fetch failed',
    };
  }
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
      const [scraped, discovery] = await Promise.all([
        scrapeOriginData(origin),
        // OpenAPI info backstops origin metadata when the homepage isn't HTML.
        // Cheap to fetch in parallel — discovery's already cached in many flows.
        fetchDiscoveryDocument(origin).catch(() => null),
      ]);
      const { og, metadata, origin: scrapedOrigin, favicon } = scraped;
      const openApiInfo = discovery?.success ? discovery.info : undefined;

      const title =
        metadata?.title ?? og?.ogTitle ?? openApiInfo?.title ?? null;
      const description =
        metadata?.description ??
        og?.ogDescription ??
        openApiInfo?.description ??
        null;
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

  /** Batch test multiple resources to get their x402 responses */
  batchTest: publicProcedure
    .input(
      z.object({
        resources: z
          .array(
            z.object({
              url: z.string().url(),
              method: z
                .enum([
                  'GET',
                  'POST',
                  'PUT',
                  'PATCH',
                  'DELETE',
                  'HEAD',
                  'OPTIONS',
                  'TRACE',
                ])
                .optional(),
              /** Auth classification from discovery. SIWX routes are skipped
               *  because they are identity-gated, not x402-paid — probing them
               *  would incorrectly mark them as failed. */
              authMode: z
                .enum(['paid', 'siwx', 'apiKey', 'apiKey+paid', 'unprotected'])
                .optional(),
              /** If true, this resource is invalid and should not be tested */
              invalid: z.boolean().optional(),
              /** Reason why resource is invalid */
              invalidReason: z.string().optional(),
              /** Merchant-provided sample request body (JSON string) for endpoints
               *  that validate input before the x402 paywall fires. */
              sampleBody: z.string().max(10000).optional(),
            })
          )
          .max(20),
      })
    )
    .mutation(async ({ input }) => {
      // Separate invalid resources from valid ones
      const invalidResults: FailedResource[] = input.resources
        .filter(r => r.invalid)
        .map(r => ({
          success: false as const,
          url: r.url,
          error: r.invalidReason ?? 'Invalid resource format',
        }));

      // Only probe endpoints that are x402-paid. Non-paid endpoints
      // (unprotected, apiKey-only, no authMode) are returned as failed
      // with a clear reason. SIWX endpoints are excluded entirely (they
      // are surfaced via authModeMap on the client).
      const paidModes = new Set(['paid', 'apiKey+paid']);
      const nonPaidResults: FailedResource[] = input.resources
        .filter(
          r =>
            !r.invalid &&
            r.authMode !== 'siwx' &&
            (r.authMode == null || !paidModes.has(r.authMode))
        )
        .map(r => ({
          success: false as const,
          url: r.url,
          error: `Not an x402 paid endpoint (authMode: ${r.authMode ?? 'none'})`,
        }));

      const probeableResources = input.resources.filter(
        r => !r.invalid && r.authMode != null && paidModes.has(r.authMode)
      );
      // Probe sequentially to avoid overwhelming the merchant's server.
      // Concurrent probes to the same origin can trigger rate limiting (503s).
      const testResults = [];
      for (const r of probeableResources) {
        testResults.push(
          await testSingleResource(r.url, r.method, r.sampleBody)
        );
      }

      // Combine test results with invalid and non-paid results
      const allResults = [...testResults, ...invalidResults, ...nonPaidResults];

      return {
        resources: allResults.filter(
          (r): r is Extract<typeof r, { success: true }> => r.success
        ),
        failed: allResults.filter((r): r is FailedResource => !r.success),
      };
    }),
});
