import { probeX402Endpoint } from './probe';
import { registerResource } from '@/lib/resources';
import { discoverSiblingResources } from './discover-siblings';
import { isTunnelUrl } from '@/lib/url-helpers';

/**
 * Single orchestrator for registering a single x402 resource.
 *
 * Owns the full flow: probe → validate → register → discover siblings.
 * Both the REST API handler and the TRPC mutation delegate to this function
 * so that registration behavior is identical across all surfaces.
 */
export async function registerEndpoint(
  url: string,
  options?: {
    notifyNewServer?: boolean;
    originMetadataFallback?: { title?: string; description?: string };
  }
) {
  // 0. Reject ephemeral tunnel URLs
  if (isTunnelUrl(url)) {
    return {
      success: false as const,
      error: {
        type: 'tunnel' as const,
        message:
          "Tunnel URLs are ephemeral and can't be reliably discovered by agents. Deploy your API to a permanent URL to register.",
      },
    };
  }

  // 1. Probe the endpoint for a 402 response
  const probeResult = await probeX402Endpoint(url);

  if (!probeResult.success) {
    return {
      success: false as const,
      error: {
        type: 'no402' as const,
        message: probeResult.error,
      },
    };
  }

  // 2. Register the resource (includes HTTPS, v1, SIWX validation)
  const result = await registerResource(url, probeResult.advisory, {
    warnings: probeResult.warnings,
    ...options,
  });

  if (!result.success) {
    const parseErrors: string[] =
      result.error.type === 'parseResponse' ||
      result.error.type === 'validation'
        ? result.error.parseErrors
        : 'upsertErrors' in result.error
          ? result.error.upsertErrors
          : [JSON.stringify(result.error)];

    return {
      success: false as const,
      error: { type: 'parseErrors' as const, parseErrors },
      data: result.data,
      warnings: result.warnings,
    };
  }

  // 3. Check for sibling resources at the same origin
  const discovery = await discoverSiblingResources(url);

  return {
    ...result,
    methodUsed: probeResult.advisory.method,
    discovery,
  };
}
