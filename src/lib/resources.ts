import z3 from 'zod3';

import { scrapeOriginData } from '@/services/scraper';
import { upsertResource } from '@/services/db/resources';
import { upsertOrigin } from '@/services/db/origin';

import {
  parseX402Response,
  type EnhancedOutputSchema,
} from '@/lib/x402/schema';
import { getOriginFromUrl } from '@/lib/url';

import type { AcceptsNetwork } from '@prisma/client';
import { x402ResponseSchema } from 'x402/types';
import { upsertResourceResponse } from '@/services/db/resource-responses';
import { formatTokenAmount } from './token';

export const registerResource = async (url: string, data: unknown) => {
  // Strip the query params from the incoming URL
  const urlObj = new URL(url);
  urlObj.search = '';
  const cleanUrl = urlObj.toString();

  // parse the x402 response to see if it fits the x402 schema
  const baseX402ParsedResponse = x402ResponseSchema
    .omit({
      error: true,
    })
    .extend({
      error: z3.string().optional(),
    })
    .safeParse(data);

  // if it doesn't fit the x402 schema, return an error
  if (!baseX402ParsedResponse.success) {
    console.error(baseX402ParsedResponse.error.issues);
    return {
      success: false as const,
      data,
      error: {
        type: 'parseResponse' as const,
        parseErrors: baseX402ParsedResponse.error.issues.map(
          issue => `${issue.path.join('.')}: ${issue.message}`
        ),
      },
    };
  }

  // scrape the origin data
  const origin = getOriginFromUrl(cleanUrl);
  const {
    og,
    metadata,
    origin: scrapedOrigin,
  } = await scrapeOriginData(origin);

  // upsert the origin data
  await upsertOrigin({
    origin: origin,
    title: metadata?.title ?? og?.ogTitle,
    description: metadata?.description ?? og?.ogDescription,
    favicon:
      og?.favicon &&
      (og.favicon.startsWith('/')
        ? scrapedOrigin.replace(/\/$/, '') + og.favicon
        : og.favicon),
    ogImages:
      og?.ogImage?.map(image => ({
        url: image.url,
        height: image.height,
        width: image.width,
        title: og.ogTitle,
        description: og.ogDescription,
      })) ?? [],
  });

  // upsert the resource
  const resource = await upsertResource({
    resource: cleanUrl,
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

  // if the resource fails to upsert, return an error
  if (!resource) {
    return {
      success: false as const,
      data,
      error: {
        type: 'database' as const,
        upsertErrors: ['Resource failed to upsert'],
      },
    };
  }

  // parse the response to see if it fits the enhanced x402 schema for allowing invocations
  let enhancedParseWarnings: string[] | null = null;
  const parsedResponse = parseX402Response(data);
  if (parsedResponse.success) {
    await upsertResourceResponse(resource.resource.id, parsedResponse.data);
  } else {
    enhancedParseWarnings = parsedResponse.errors;
  }

  return {
    success: true as const,
    resource,
    accepts: {
      ...resource.accepts,
      maxAmountRequired: formatTokenAmount(resource.accepts.maxAmountRequired),
    },
    enhancedParseWarnings,
    response: data,
  };
};
