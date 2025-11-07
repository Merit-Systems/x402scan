import z3 from 'zod3';
import { z } from 'zod';
import { x402ResponseSchema } from 'x402/types';

import { scrapeOriginData } from '@/services/scraper';
import { upsertResource } from '@/services/db/resources';
import { upsertOrigin } from '@/services/db/origin';
import { upsertResourceResponse } from '@/services/db/resource-responses';

import type { EnhancedOutputSchema } from '@/lib/x402/schema';
import { parseX402Response } from '@/lib/x402/schema';
import { formatTokenAmount } from '@/lib/token';
import { getOriginFromUrl } from '@/lib/url';
import { getFaviconUrl } from '@/lib/favicon';

import { Methods } from '@/types/x402';

import type { AcceptsNetwork } from '@prisma/client';

export type ResourceRegistrationInput = {
  url: string;
  headers?: Record<string, string>;
  body?: object;
};

export type ResourceRegistrationSuccess = {
  error: false;
  resource: Awaited<ReturnType<typeof upsertResource>>;
  accepts: {
    maxAmountRequired: string;
  } & Awaited<ReturnType<typeof upsertResource>>['accepts'];
  enhancedParseWarnings: string[] | null;
  response: unknown;
};

export type ResourceRegistrationError =
  | {
      error: true;
      type: 'parseErrors';
      parseErrorData: {
        parseErrors: string[];
        data: unknown;
      };
    }
  | {
      error: true;
      type: 'no402';
    };

export type ResourceRegistrationResult =
  | ResourceRegistrationSuccess
  | ResourceRegistrationError;

/**
 * Core resource registration logic shared between API and TRPC endpoints.
 * Attempts to register a resource by pinging it and validating the x402 response.
 */
export async function registerResource(
  input: ResourceRegistrationInput
): Promise<ResourceRegistrationResult> {
  let parseErrorData: {
    parseErrors: string[];
    data: unknown;
  } | null = null;

  // Try GET and POST methods
  for (const method of [Methods.GET, Methods.POST]) {
    // Ping resource
    const response = await fetch(input.url, {
      method,
      headers: input.headers,
      body: input.body ? JSON.stringify(input.body) : undefined,
    });

    // If it doesn't respond with a 402, continue to next method
    if (response.status !== 402) {
      continue;
    }

    const data = (await response.json()) as unknown;

    // Validate x402 response
    const baseX402ParsedResponse = x402ResponseSchema
      .omit({
        error: true,
      })
      .extend({
        error: z3.string().optional(),
      })
      .safeParse(data);

    if (!baseX402ParsedResponse.success) {
      console.error(baseX402ParsedResponse.error.issues);
      parseErrorData = {
        parseErrors: baseX402ParsedResponse.error.issues.map(
          issue => `${issue.path.join('.')}: ${issue.message}`
        ),
        data,
      };
      continue;
    }

    const origin = getOriginFromUrl(input.url);

    // Scrape origin metadata
    const {
      og,
      metadata,
      origin: scrapedOrigin,
    } = await scrapeOriginData(origin);

    // Upsert origin
    await upsertOrigin({
      origin: origin,
      title: metadata?.title ?? og?.ogTitle,
      description: metadata?.description ?? og?.ogDescription,
      favicon: og?.favicon
        ? getFaviconUrl(og.favicon, scrapedOrigin)
        : undefined,
      ogImages:
        og?.ogImage?.map(image => ({
          url: image.url,
          height: image.height,
          width: image.width,
          title: og.ogTitle,
          description: og.ogDescription,
        })) ?? [],
    });

    // Upsert the resource
    const resource = await upsertResource({
      resource: input.url.toString(),
      type: 'http',
      x402Version: baseX402ParsedResponse.data.x402Version,
      lastUpdated: new Date(),
      accepts:
        baseX402ParsedResponse.data.accepts?.map(accept => ({
          ...accept,
          network: accept.network.replace('-', '_') as AcceptsNetwork,
          maxAmountRequired: accept.maxAmountRequired,
          outputSchema: accept.outputSchema as EnhancedOutputSchema,
          extra: accept.extra,
        })) ?? [],
    });

    if (!resource) {
      continue;
    }

    // Parse the response for enhanced validation
    let enhancedParseWarnings: string[] | null = null;
    const parsedResponse = parseX402Response(data);
    if (parsedResponse.success) {
      await upsertResourceResponse(resource.resource.id, parsedResponse.data);
    } else {
      enhancedParseWarnings = parsedResponse.errors;
    }

    return {
      error: false as const,
      resource,
      accepts: {
        ...resource.accepts,
        maxAmountRequired: formatTokenAmount(
          resource.accepts.maxAmountRequired
        ),
      },
      enhancedParseWarnings,
      response: data,
    };
  }

  // If we get here, no 402 response was found
  if (parseErrorData) {
    return {
      error: true as const,
      type: 'parseErrors' as const,
      parseErrorData,
    };
  }

  return {
    error: true as const,
    type: 'no402' as const,
  };
}
