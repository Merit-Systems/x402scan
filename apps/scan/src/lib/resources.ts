import { scrapeOriginData } from '@/services/scraper';
import { upsertResource } from '@/services/db/resources/resource';
import { upsertOrigin } from '@/services/db/resources/origin';

import { validateX402 } from '@/lib/x402/validate';
import { getOriginFromUrl } from '@/lib/url';

import { upsertResourceResponse } from '@/services/db/resources/response';
import { formatTokenAmount } from './token';
import { SUPPORTED_CHAINS } from '@/types/chain';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { verifyAcceptsOwnership } from '@/services/verification/accepts-verification';

import type { AcceptsNetwork } from '@x402scan/scan-db';

export const registerResource = async (url: string, data: unknown) => {
  const urlObj = new URL(url);
  urlObj.search = '';
  const cleanUrl = urlObj.toString();

  const validated = validateX402(data);
  if (!validated.success) {
    console.error(validated.errors);
    return {
      success: false as const,
      data,
      error: {
        type: 'parseResponse' as const,
        parseErrors: validated.errors,
      },
    };
  }

  const x402Data = validated.parsed;

  const origin = getOriginFromUrl(cleanUrl);
  const { og, metadata, favicon } = await scrapeOriginData(origin);

  await upsertOrigin({
    origin,
    title: metadata?.title ?? og?.ogTitle,
    description: metadata?.description ?? og?.ogDescription,
    favicon: favicon ?? undefined,
    ogImages:
      og?.ogImage?.map(image => ({
        url: image.url,
        height: image.height,
        width: image.width,
        title: og.ogTitle,
        description: og.ogDescription,
      })) ?? [],
  });

  const normalizedAccepts = validated.normalizedAccepts;

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

  // Attempt ownership verification (non-blocking)
  // This runs in the background and won't block registration success
  void (async () => {
    try {
      const discoveryResult = await fetchDiscoveryDocument(origin);
      if (
        discoveryResult.success &&
        discoveryResult.ownershipProofs &&
        discoveryResult.ownershipProofs.length > 0
      ) {
        const acceptIds = resource.accepts.map(accept => accept.id);
        await verifyAcceptsOwnership({
          acceptIds,
          ownershipProofs: discoveryResult.ownershipProofs,
          origin,
        });
      }
    } catch (error) {
      // Log verification errors but don't fail registration
      console.error(
        'Ownership verification failed during registration:',
        error
      );
    }
  })();

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
        favicon: favicon ?? null,
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
