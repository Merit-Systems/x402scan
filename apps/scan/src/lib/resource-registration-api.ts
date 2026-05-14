import z from 'zod';

import { probeX402Endpoint } from '@/lib/discovery/probe';
import { registerResourcesFromDiscovery } from '@/lib/discovery/register-origin';
import { registerResource } from '@/lib/resources';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { getOriginFromUrl, normalizeUrl } from '@/lib/url';

import type { DiscoveryInfo } from '@/types/discovery';

export const registerResourceUrlRequestSchema = z.object({
  url: z.url(),
});

export const registerOriginRequestSchema = z.object({
  origin: z.url(),
});

export type RegisterResourceUrlRequest = z.infer<
  typeof registerResourceUrlRequestSchema
>;
export type RegisterOriginRequest = z.infer<typeof registerOriginRequestSchema>;

export async function registerResourceUrl(input: RegisterResourceUrlRequest) {
  const url = input.url.toString();
  const probeUrl = url.replaceAll('{', '').replaceAll('}', '');
  const probeResult = await probeX402Endpoint(probeUrl);

  if (!probeResult.success) {
    return { success: false as const, error: { type: 'no402' as const } };
  }

  const result = await registerResource(url, probeResult.advisory);

  if (result.success === false) {
    return {
      success: false as const,
      data: result.data,
      error: {
        type: 'parseErrors' as const,
        parseErrors:
          result.error.type === 'parseResponse'
            ? result.error.parseErrors
            : [JSON.stringify(result.error)],
      },
    };
  }

  const origin = getOriginFromUrl(url);
  let discovery: DiscoveryInfo = {
    found: false,
    otherResourceCount: 0,
    origin,
  };

  try {
    const discoveryResult = await fetchDiscoveryDocument(origin);
    if (discoveryResult.success && Array.isArray(discoveryResult.resources)) {
      const normalizedInputUrl = normalizeUrl(url);
      const otherResources = discoveryResult.resources.filter(resource => {
        if (
          !resource ||
          typeof resource !== 'object' ||
          !('url' in resource) ||
          typeof resource.url !== 'string'
        ) {
          return false;
        }
        return normalizeUrl(resource.url) !== normalizedInputUrl;
      });

      discovery = {
        found: true,
        source: discoveryResult.source,
        otherResourceCount: otherResources.length,
        origin,
        resources: otherResources.map(resource => resource.url),
      };
    }
  } catch {
    // Registration should not fail just because optional discovery lookup failed.
  }

  return {
    ...result,
    methodUsed: probeResult.advisory.method,
    discovery,
  };
}

export async function registerOrigin(input: RegisterOriginRequest) {
  const discoveryResult = await fetchDiscoveryDocument(input.origin);

  if (!discoveryResult.success) {
    return {
      success: false as const,
      error: {
        type: 'noDiscovery' as const,
        message: discoveryResult.error ?? 'No discovery document found',
      },
    };
  }

  const result = await registerResourcesFromDiscovery(
    discoveryResult.resources,
    discoveryResult.source
  );

  if (result.registered === 0) {
    return {
      success: false as const,
      error: {
        type: 'noValidResources' as const,
        message:
          'No valid paid x402 resources were found for this origin. Add at least one paid x402 resource that passes validation to complete registration.',
      },
      result,
    };
  }

  return { success: true as const, ...result };
}

