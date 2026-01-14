import { scrapeOriginData } from '@/services/scraper';
import { upsertResource } from '@/services/db/resources/resource';
import { upsertOrigin } from '@/services/db/resources/origin';

import { parseX402Response, normalizeAccepts } from '@/lib/x402';
import { getOriginFromUrl } from '@/lib/url';

import { upsertResourceResponse } from '@/services/db/resources/response';
import { formatTokenAmount } from './token';
import { SUPPORTED_CHAINS } from '@/types/chain';

import type { AcceptsNetwork } from '@x402scan/scan-db';

export const registerResource = async (url: string, data: unknown) => {
  const urlObj = new URL(url);
  urlObj.search = '';
  const cleanUrl = urlObj.toString();

  const parsedResponse = parseX402Response(data);

  if (!parsedResponse.success) {
    console.error(parsedResponse.errors);
    return {
      success: false as const,
      data,
      error: {
        type: 'parseResponse' as const,
        parseErrors: parsedResponse.errors,
      },
    };
  }

  const x402Data = parsedResponse.data;

  if (!x402Data.accepts?.length) {
    return {
      success: false as const,
      data,
      error: {
        type: 'parseResponse' as const,
        parseErrors: [
          'Accepts must contain at least one valid payment requirement',
        ],
      },
    };
  }

  const origin = getOriginFromUrl(cleanUrl);
  const {
    og,
    metadata,
    origin: scrapedOrigin,
  } = await scrapeOriginData(origin);

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

  const normalizedAccepts = normalizeAccepts(x402Data);

  const resource = await upsertResource({
    resource: cleanUrl,
    type: 'http',
    x402Version: x402Data.x402Version,
    lastUpdated: new Date(),
    accepts: normalizedAccepts
      .filter(accept =>
        (SUPPORTED_CHAINS as readonly string[]).includes(
          accept.network.replace('-', '_')
        )
      )
      .map(accept => ({
        ...accept,
        network: accept.network.replace('-', '_') as AcceptsNetwork,
        maxAmountRequired: accept.maxAmountRequired,
        outputSchema: accept.outputSchema,
        extra: accept.extra,
      })),
  });

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

  await upsertResourceResponse(resource.resource.id, x402Data);

  return {
    success: true as const,
    resource,
    accepts: resource.accepts.map(accept => ({
      ...accept,
      maxAmountRequired: formatTokenAmount(accept.maxAmountRequired),
    })),
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
