import z from 'zod';
import { Result } from 'better-result';

import { createTRPCRouter, publicProcedure } from '../trpc';

import { getOriginFromUrl } from '@/lib/url';
import { scrapeOriginData } from '@/services/scraper';
import type { FailedResource, TestedResource } from '@/types/batch-test';
import { probeX402Endpoint } from '@/lib/discovery/probe';
import { InvalidUrl, MissingInputSchema } from '@/lib/discovery/errors';

async function testSingleResource(
  url: string,
  method?: string
): Promise<TestedResource | FailedResource> {
  const result = await probeX402Endpoint(url, method);

  if (Result.isError(result)) {
    return {
      success: false as const,
      url,
      error: result.error,
    };
  }

  const { advisory } = result.value;

  if (!advisory.inputSchema) {
    return {
      success: false as const,
      url,
      error: new MissingInputSchema({
        url,
        method: advisory.method,
        message: 'Missing input schema',
      }),
    };
  }

  return {
    success: true as const,
    url,
    method: advisory.method as TestedResource['method'],
    description: advisory.summary ?? null,
    parsed: advisory,
    warnings: result.value.warnings,
  };
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
        favicon,
      } = await scrapeOriginData(origin);

      const title = metadata?.title ?? og?.ogTitle ?? null;
      const description = metadata?.description ?? og?.ogDescription ?? null;
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
          error: new InvalidUrl({
            url: r.url,
            message: r.invalidReason ?? 'Invalid resource format',
          }),
        }));

      // SIWX routes are identity-gated, not payment-protected. Skip probing
      // them — they are surfaced via authModeMap on the client and should not
      // appear in either the tested or failed buckets.
      const probeableResources = input.resources.filter(
        r => !r.invalid && r.authMode !== 'siwx'
      );
      const testResults = await Promise.all(
        probeableResources.map(r => testSingleResource(r.url, r.method))
      );

      // Combine test results with invalid results
      const allResults = [...testResults, ...invalidResults];

      return {
        resources: allResults.filter(
          (r): r is Extract<typeof r, { success: true }> => r.success
        ),
        failed: allResults.filter((r): r is FailedResource => !r.success),
      };
    }),
});
