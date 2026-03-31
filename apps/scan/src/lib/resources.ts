import { scrapeOriginData } from '@/services/scraper';
import { upsertResource } from '@/services/db/resources/resource';
import { upsertOrigin } from '@/services/db/resources/origin';

import type { EndpointMethodAdvisory } from '@agentcash/discovery';
import { isX402PaymentOption } from '@/lib/discovery/utils';

import { getOriginFromUrl } from '@/lib/url';

import { upsertResourceResponse } from '@/services/db/resources/response';
import { formatTokenAmount } from './token';
import { SUPPORTED_CHAINS } from '@/types/chain';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { verifyAcceptsOwnership } from '@/services/verification/accepts-verification';
import { outputSchemaV1 } from '@/lib/x402/v1';
import {
  normalizeChainId,
  parseX402Response,
  getOutputSchema,
  type ParsedX402Response,
} from '@/lib/x402';

import type { AcceptsNetwork } from '@x402scan/scan-db';

export const registerResource = async (
  url: string,
  advisory: EndpointMethodAdvisory
) => {
  const x402Options = (advisory.paymentOptions ?? []).filter(
    isX402PaymentOption
  );
  const urlObj = new URL(url);
  urlObj.search = '';
  const cleanUrl = urlObj.toString();

  if (x402Options.length === 0) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'parseResponse' as const,
        parseErrors: ['No payment options found'],
      },
    };
  }

  if (!advisory.inputSchema) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'parseResponse' as const,
        parseErrors: ['Missing input schema'],
      },
    };
  }

  // Try v1 parse first (works when inputSchema includes type/method)
  let outputSchemaForDb = outputSchemaV1.safeParse({
    input: advisory.inputSchema,
    output: advisory.outputSchema ?? null,
  }).data;

  // Fallback: use v2-aware extraction from raw 402 body
  if (!outputSchemaForDb && advisory.paymentRequiredBody) {
    const parsed = parseX402Response(advisory.paymentRequiredBody);
    if (parsed.success) {
      const extracted = getOutputSchema(parsed.data);
      if (extracted) {
        const input = extracted.input as Record<string, unknown>;
        if (!input.method && advisory.method) {
          input.method = advisory.method;
        }
        outputSchemaForDb = extracted;
      }
    }
  }

  const mappedAccepts = x402Options
    .map(opt => ({
      scheme: (opt.scheme ?? 'exact') as 'exact',
      network: normalizeChainId(opt.network).replace(
        '-',
        '_'
      ) as AcceptsNetwork,
      maxAmountRequired:
        ('amount' in opt ? opt.amount : opt.maxAmountRequired) ?? '0',
      payTo: opt.payTo ?? '',
      asset: opt.asset,
      maxTimeoutSeconds: opt.maxTimeoutSeconds ?? 60,
      outputSchema: outputSchemaForDb,
      extra: undefined,
    }))
    .filter(accept =>
      (SUPPORTED_CHAINS as readonly string[]).includes(accept.network)
    );

  const x402Version = x402Options[0]?.version ?? 1;

  const origin = getOriginFromUrl(cleanUrl);
  const { og, metadata, favicon } = await scrapeOriginData(origin);

  const title = metadata?.title ?? og?.ogTitle ?? null;
  const description = metadata?.description ?? og?.ogDescription ?? null;

  await upsertOrigin({
    origin,
    title: title ?? undefined,
    description: description ?? undefined,
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

  const resource = await upsertResource({
    resource: cleanUrl,
    type: 'http',
    x402Version,
    lastUpdated: new Date(),
    accepts: mappedAccepts,
  });

  if (!resource) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'database' as const,
        upsertErrors: ['Resource failed to upsert'],
      },
    };
  }

  await upsertResourceResponse(
    resource.resource.id,
    (advisory.paymentRequiredBody ?? {}) as ParsedX402Response
  );

  // Attempt ownership verification (non-blocking)
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
    response: advisory.paymentRequiredBody,
    registrationDetails: {
      providedAccepts: mappedAccepts,
      supportedAccepts: resource.accepts,
      unsupportedAccepts: resource.unsupportedAccepts,
      originMetadata: {
        title,
        description,
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
