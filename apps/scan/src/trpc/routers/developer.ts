import z from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

import { getOriginFromUrl } from '@/lib/url';
import { scrapeOriginData } from '@/services/scraper';
import type { FailedResource, TestedResource } from '@/types/batch-test';
import { probeX402Endpoint } from '@/lib/discovery/probe';

async function testSingleResource(url: string) {
  try {
    const result = await probeX402Endpoint(url);

    if (!result.success) {
      return { success: false as const, url, error: result.error };
    }

    const { advisory } = result;

    if (!advisory.inputSchema) {
      return { success: false as const, url, error: 'Missing input schema' };
    }

    return {
      success: true as const,
      url,
      method: advisory.method as TestedResource['method'],
      description: advisory.summary ?? null,
      parsed: advisory,
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
        failed: allResults.filter((r): r is FailedResource => !r.success),
      };
    }),
});
