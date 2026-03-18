import z from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

import { getOriginFromUrl } from '@/lib/url';
import { scrapeOriginData } from '@/services/scraper';
import type { FailedResource, TestedResource } from '@/types/batch-test';
import {
  checkEndpointSchema,
  validatePaymentRequiredDetailed,
} from '@agentcash/discovery';
import { isX402ValidationIssue } from '@/types/validation';
import { isNonBlockingIssue } from '@/lib/discovery/utils';

async function testSingleResource(url: string) {
  try {
    const result = await checkEndpointSchema({
      url,
      probe: true,
      signal: AbortSignal.timeout(10000),
    });

    if (!result.found) {
      return {
        success: false as const,
        url,
        error: result.message ?? `Endpoint not found: ${result.cause}`,
      };
    }

    let lastError: { message: string; issues?: unknown[] } | null = null;

    for (const advisory of result.advisories) {
      if (!advisory.paymentOptions?.some(p => p.protocol === 'x402')) continue;

      const validation = advisory.paymentRequiredBody
        ? validatePaymentRequiredDetailed(advisory.paymentRequiredBody, {
            compatMode: 'strict',
            requireInputSchema: true,
            requireOutputSchema: true,
          })
        : null;
      const issues = (validation?.issues ?? []).filter(isX402ValidationIssue);

      if (validation && !validation.valid) {
        const blockingErrors = issues.filter(
          issue => issue.severity === 'error' && !isNonBlockingIssue(issue)
        );
        if (blockingErrors.length > 0) {
          lastError = {
            message: blockingErrors
              .map(e => `${e.code}${e.path ? ': ' + e.path : ''}: ${e.message}`)
              .join('; '),
            issues,
          };
          continue;
        }
      }

      if (!advisory.inputSchema) {
        lastError = { message: 'Missing input schema', issues };
        continue;
      }

      return {
        success: true as const,
        url,
        method: advisory.method as TestedResource['method'],
        description: advisory.summary ?? null,
        parsed: advisory,
      };
    }

    if (lastError) {
      return {
        success: false as const,
        url,
        error: lastError.message,
        issues: lastError.issues,
      };
    }

    return {
      success: false as const,
      url,
      error: 'No valid x402 response found',
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
    .query(async ({ input }) => {
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
