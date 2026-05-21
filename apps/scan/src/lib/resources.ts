import { scrapeOriginData } from '@/services/scraper';
import { upsertResource } from '@/services/db/resources/resource';
import {
  getOriginResourceCount,
  upsertOrigin,
} from '@/services/db/resources/origin';

import type {
  EndpointMethodAdvisory,
  AuditWarning,
} from '@agentcash/discovery';
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

import { convertOpenApiSchemaToV1 } from '@/lib/openapi-to-v1';
import { notifyNewServer } from '@/lib/discord-notifications';

/**
 * Pure validation — no DB writes, no side effects. Used by both
 * registerResource() and the batch-test endpoint so the pre-registration
 * count matches the actual registration outcome.
 */
export function validateResource(
  url: string,
  advisory: EndpointMethodAdvisory
): { valid: true; warnings: AuditWarning[] } | { valid: false; error: string } {
  const warnings: AuditWarning[] = [];

  // HTTPS enforcement (allow localhost / 127.0.0.1 for dev)
  const urlObj = new URL(url);
  if (
    urlObj.protocol === 'http:' &&
    urlObj.hostname !== 'localhost' &&
    urlObj.hostname !== '127.0.0.1'
  ) {
    return {
      valid: false,
      error: 'HTTPS is required for x402 resource registration',
    };
  }

  // v1 rejection — only v2 resources can be registered
  const x402Options = (advisory.paymentOptions ?? []).filter(
    isX402PaymentOption
  );
  const hasOnlyV1 =
    x402Options.length > 0 && x402Options.every(o => o.version === 1);
  if (hasOnlyV1) {
    return {
      valid: false,
      error: 'x402 v1 response detected — migrate to v2 spec',
    };
  }

  // No x402 payment options
  if (x402Options.length === 0) {
    return { valid: false, error: 'No x402 payment options found' };
  }

  // Missing input schema — check advisory.inputSchema first, then fall back to
  // the bazaar extension in the raw 402 body. The discovery package doesn't
  // always extract schemas from bazaar, but the data is often there.
  if (!advisory.inputSchema) {
    let hasBazaarSchema = false;
    if (
      advisory.paymentRequiredBody &&
      typeof advisory.paymentRequiredBody === 'object' &&
      advisory.paymentRequiredBody !== null
    ) {
      try {
        const parsed = parseX402Response(advisory.paymentRequiredBody);
        if (parsed.success) {
          const extracted = getOutputSchema(parsed.data);
          hasBazaarSchema = !!extracted;
        }
      } catch {
        // Malformed bazaar data — treat as missing schema
      }
    }
    if (!hasBazaarSchema) {
      return {
        valid: false,
        error:
          'Missing input schema — add request/response schemas to your OpenAPI spec',
      };
    }
  }

  // Unsupported networks
  const hasSupported = x402Options.some(opt =>
    (SUPPORTED_CHAINS as readonly string[]).includes(
      normalizeChainId(opt.network)
    )
  );
  if (!hasSupported) {
    const advertisedNetworks = Array.from(
      new Set(x402Options.map(o => normalizeChainId(o.network)))
    );
    return {
      valid: false,
      error: `No supported networks. Got: [${advertisedNetworks.join(', ')}]. Supported: [${(SUPPORTED_CHAINS as readonly string[]).join(', ')}]`,
    };
  }

  // SIWX warning — identity-gated endpoints are valid but not payment-protected
  if (advisory.authMode === 'siwx') {
    warnings.push({
      code: 'SIWX_ENDPOINT',
      severity: 'warn',
      message:
        'This endpoint uses SIWX authentication (identity-gated, not payment-protected)',
    });
  }

  return { valid: true, warnings };
}

export const registerResource = async (
  url: string,
  advisory: EndpointMethodAdvisory,
  options: {
    notifyNewServer?: boolean;
    /**
     * Title/description to fall back to when the origin's homepage isn't HTML
     * (so the scraper finds no <title>/meta/OG tags). Typically the OpenAPI
     * `info` block from discovery.
     */
    originMetadataFallback?: { title?: string; description?: string };
    /** Warnings from probeX402Endpoint — merged into the result. */
    warnings?: AuditWarning[];
  } = {}
) => {
  const validation = validateResource(url, advisory);

  if (!validation.valid) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'validation' as const,
        parseErrors: [validation.error],
      },
      warnings: [...(options.warnings ?? [])],
    };
  }

  const x402Options = (advisory.paymentOptions ?? []).filter(
    isX402PaymentOption
  );
  const warnings: AuditWarning[] = [
    ...(options.warnings ?? []),
    ...validation.warnings,
  ];

  const urlObj = new URL(url);
  urlObj.search = '';
  const cleanUrl = urlObj.toString();
  const origin = getOriginFromUrl(cleanUrl);
  const shouldNotifyNewServer = options.notifyNewServer ?? true;

  const existingOriginResourceCount = shouldNotifyNewServer
    ? await getOriginResourceCount(origin)
    : null;

  // Try v1 parse first (works when inputSchema includes type/method)
  let outputSchemaForDb = outputSchemaV1.safeParse({
    input: advisory.inputSchema,
    output: advisory.outputSchema ?? null,
  }).data;
  let schemaSource = outputSchemaForDb ? 'v1' : undefined;

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
        schemaSource = 'v2-bazaar';
      }
    }
  }

  // Fallback: convert raw OpenAPI-format inputSchema to v1 format.
  if (!outputSchemaForDb && advisory.inputSchema) {
    const converted = convertOpenApiSchemaToV1(
      advisory.inputSchema,
      advisory.method,
      advisory.outputSchema
    );
    if (converted) {
      outputSchemaForDb = converted;
      schemaSource = 'openapi-converted';
    }
  }

  if (!outputSchemaForDb) {
    console.warn(
      `[registerResource] No output schema resolved for ${cleanUrl}`,
      `method=${advisory.method}`,
      `hasInputSchema=${!!advisory.inputSchema}`,
      `hasPaymentBody=${!!advisory.paymentRequiredBody}`,
      `inputSchemaKeys=${advisory.inputSchema ? Object.keys(advisory.inputSchema).join(',') : 'none'}`
    );
  } else {
    console.log(
      `[registerResource] Schema resolved via ${schemaSource} for ${cleanUrl}`
    );
  }

  const allMappedAccepts = x402Options.map(opt => ({
    scheme: opt.scheme ?? 'exact',
    network: normalizeChainId(opt.network) as AcceptsNetwork,
    maxAmountRequired:
      ('amount' in opt ? opt.amount : opt.maxAmountRequired) ?? '0',
    payTo: opt.payTo ?? '',
    asset: opt.asset,
    maxTimeoutSeconds: opt.maxTimeoutSeconds ?? 60,
    outputSchema: outputSchemaForDb,
    extra: undefined,
  }));

  const mappedAccepts = allMappedAccepts.filter(accept =>
    (SUPPORTED_CHAINS as readonly string[]).includes(accept.network)
  );

  // This should never fire since validateResource already checked, but
  // guard defensively in case the chain list diverges at runtime.
  if (mappedAccepts.length === 0) {
    const advertisedNetworks = Array.from(
      new Set(allMappedAccepts.map(a => a.network))
    );
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'parseResponse' as const,
        parseErrors: [
          `No supported networks advertised. Got: [${advertisedNetworks.join(', ')}]. Supported: [${(SUPPORTED_CHAINS as readonly string[]).join(', ')}]. Testnets are not indexed.`,
        ],
      },
      warnings,
    };
  }

  const parsedPaymentRequiredBody = parseX402Response(
    advisory.paymentRequiredBody
  );
  if (!parsedPaymentRequiredBody.success) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'parseResponse' as const,
        parseErrors: parsedPaymentRequiredBody.errors,
      },
      warnings,
    };
  }

  const x402Version = x402Options[0]?.version ?? 1;

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
      warnings,
    };
  }

  const { og, metadata, favicon } = await scrapeOriginData(origin);

  const title =
    metadata?.title ??
    og?.ogTitle ??
    options.originMetadataFallback?.title ??
    null;
  const description =
    metadata?.description ??
    og?.ogDescription ??
    options.originMetadataFallback?.description ??
    null;

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

  await upsertResourceResponse(
    resource.resource.id,
    (advisory.paymentRequiredBody ?? {}) as ParsedX402Response
  );

  if (existingOriginResourceCount === 0) {
    notifyNewServer({
      originId: resource.origin.id,
      origin,
      title: title ?? null,
      description: description ?? null,
    });
  }

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
    warnings,
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
