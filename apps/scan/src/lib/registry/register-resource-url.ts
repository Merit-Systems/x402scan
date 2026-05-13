import { probeX402Endpoint } from '@/lib/discovery/probe';
import { registerResource } from '@/lib/resources';
import { getOriginFromUrl, normalizeUrl } from '@/lib/url';
import { isLocalUrl } from '@/lib/url-helpers';
import { fetchDiscoveryDocument } from '@/services/discovery';

import type { DiscoveryInfo } from '@/types/discovery';

type RegisterResourceSuccess = Extract<
  Awaited<ReturnType<typeof registerResource>>,
  { success: true }
>;

type RegisterResourceUrlFailure =
  | {
      success: false;
      data?: never;
      error: {
        type: 'unsupportedUrl';
        message: string;
      };
    }
  | {
      success: false;
      data?: never;
      error: {
        type: 'no402';
        message: string;
      };
    }
  | {
      success: false;
      data: unknown;
      error: {
        type: 'parseErrors';
        parseErrors: string[];
      };
    };

export type RegisterResourceUrlResult =
  | (RegisterResourceSuccess & {
      methodUsed: string;
      discovery: DiscoveryInfo;
    })
  | RegisterResourceUrlFailure;

function validatePublicResourceUrl(url: string): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL';
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Only HTTP(S) URLs are supported';
  }

  if (isLocalUrl(url)) {
    return 'Local and private network URLs are not supported';
  }

  return undefined;
}

async function getDiscoveryInfo(url: string): Promise<DiscoveryInfo> {
  const origin = getOriginFromUrl(url);
  const discovery: DiscoveryInfo = {
    found: false,
    otherResourceCount: 0,
    origin,
  };

  try {
    const discoveryResult = await fetchDiscoveryDocument(origin);
    if (!discoveryResult.success || !Array.isArray(discoveryResult.resources)) {
      return discovery;
    }

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

    return {
      found: true,
      source: discoveryResult.source,
      otherResourceCount: otherResources.length,
      origin,
      resources: otherResources.map(resource => resource.url),
    };
  } catch {
    return discovery;
  }
}

export async function registerResourceUrl(
  url: string
): Promise<RegisterResourceUrlResult> {
  const validationError = validatePublicResourceUrl(url);
  if (validationError) {
    return {
      success: false,
      error: { type: 'unsupportedUrl', message: validationError },
    };
  }

  const probeResult = await probeX402Endpoint(
    url.replaceAll('{', '').replaceAll('}', '')
  );

  if (!probeResult.success) {
    return {
      success: false,
      error: { type: 'no402', message: probeResult.error },
    };
  }

  const result = await registerResource(url, probeResult.advisory);

  if (!result.success) {
    return {
      success: false,
      data: result.data,
      error: {
        type: 'parseErrors',
        parseErrors:
          result.error.type === 'parseResponse'
            ? result.error.parseErrors
            : [JSON.stringify(result.error)],
      },
    };
  }

  return {
    ...result,
    methodUsed: probeResult.advisory.method,
    discovery: await getDiscoveryInfo(url),
  };
}
