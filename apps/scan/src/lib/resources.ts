import z3 from 'zod3';

import { scrapeOriginData } from '@/services/scraper';
import { upsertResource } from '@/services/db/resources/resource';
import { upsertOrigin } from '@/services/db/resources/origin';

import {
  paymentRequirementsSchema,
  parseX402Response,
  normalizePaymentRequirement,
  isV2Response,
  type PaymentRequirements,
} from '@/lib/x402';
import { getOriginFromUrl } from '@/lib/url';

import { x402ResponseSchema } from 'x402/types';
import { upsertResourceResponse } from '@/services/db/resources/response';
import { formatTokenAmount } from './token';
import { SUPPORTED_CHAINS } from '@/types/chain';

import type { AcceptsNetwork } from '@x402scan/scan-db';

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
      accepts: z3
        .array(z3.any())
        .refine(accepts => {
          return accepts.some(accept => {
            // Accept both v1 and v2 payment requirements
            const parsed = paymentRequirementsSchema.safeParse(accept);
            return parsed.success;
          });
        }, 'Accepts must contain at least one valid payment requirement')
        .transform(
          accepts =>
            accepts
              .map(accept => {
                const parsed = paymentRequirementsSchema.safeParse(accept);
                if (!parsed.success) {
                  return null;
                }
                return parsed.data;
              })
              .filter(Boolean) as PaymentRequirements[]
        ),
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
    favicon: og?.favicon
      ? new URL(og.favicon, scrapedOrigin).toString()
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

  // Parse the enhanced response to get resourceInfo for v2
  const parsedResponse = parseX402Response(data);
  const resourceInfo = parsedResponse.success && isV2Response(parsedResponse.data)
    ? parsedResponse.data.resourceInfo
    : undefined;

  // Normalize accepts to common format, handling both v1 and v2
  const normalizedAccepts = baseX402ParsedResponse.data.accepts?.map(accept =>
    normalizePaymentRequirement(accept, resourceInfo)
  ) ?? [];

  // upsert the resource
  const resource = await upsertResource({
    resource: cleanUrl,
    type: 'http',
    x402Version: baseX402ParsedResponse.data.x402Version,
    lastUpdated: new Date(),
    accepts: normalizedAccepts
      .filter(accept =>
        (SUPPORTED_CHAINS as ReadonlyArray<string>).includes(
          accept.network!.replace('-', '_')
        )
      )
      .map(accept => ({
        ...accept,
        network: accept.network!.replace('-', '_') as AcceptsNetwork,
        maxAmountRequired: accept.maxAmountRequired,
        outputSchema: accept.outputSchema,
        extra: accept.extra,
      })),
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
  if (parsedResponse.success) {
    await upsertResourceResponse(resource.resource.id, parsedResponse.data);
  } else {
    enhancedParseWarnings = parsedResponse.errors;
  }

  return {
    success: true as const,
    resource,
    accepts: resource.accepts.map(accept => ({
      ...accept,
      maxAmountRequired: formatTokenAmount(accept.maxAmountRequired),
    })),
    enhancedParseWarnings,
    response: data,
    registrationDetails: {
      providedAccepts: normalizedAccepts,
      supportedAccepts: resource.accepts,
      unsupportedAccepts: resource.unsupportedAccepts,
      originMetadata: {
        title: metadata?.title ?? og?.ogTitle ?? null,
        description: metadata?.description ?? og?.ogDescription ?? null,
        favicon: og?.favicon
          ? new URL(og.favicon, scrapedOrigin).toString()
          : null,
        ogImages:
          og?.ogImage?.map(image => ({
            url: image.url,
            height: image.height,
            width: image.width,
          })) ?? [],
      },
    },
  };
};
