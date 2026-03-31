import { probeX402Endpoint } from './probe';
import { getRegistrationErrorMessage } from './utils';
import { registerResource } from '@/lib/resources';
import { deprecateStaleResources } from '@/services/db/resources/resource';

const BULK_REGISTER_CONCURRENCY = 6;

async function mapSettledWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency = BULK_REGISTER_CONCURRENCY
): Promise<PromiseSettledResult<R>[]> {
  const results: (PromiseSettledResult<R> | undefined)[] = Array.from({
    length: items.length,
  });
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;

      if (current >= items.length) return;
      const item = items[current] as T;

      try {
        const value = await mapper(item, current);
        results[current] = { status: 'fulfilled', value };
      } catch (reason) {
        results[current] = { status: 'rejected', reason };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results.map((result, index) => {
    if (!result) {
      return {
        status: 'rejected',
        reason: new Error(`Missing result at index ${index}`),
      };
    }
    return result;
  });
}

export interface RegisterOriginResult {
  registered: number;
  failed: number;
  skipped: number;
  deprecated: number;
  total: number;
  source: string | undefined;
  failedDetails: { url: string; error: string; status?: number }[];
  skippedDetails: { url: string; error: string; status?: number }[];
  originId: string | undefined;
}

/**
 * Probe and register all resources from a discovery document.
 * Skips SIWX-only endpoints and endpoints without an input schema.
 * Deprecates resources from the same origin that are no longer in the list.
 */
export async function registerResourcesFromDiscovery(
  resources: { url: string }[],
  source: string | undefined
): Promise<RegisterOriginResult> {
  const results = await mapSettledWithConcurrency(resources, async resource => {
    const resourceUrl = resource.url;

    const probeResult = await probeX402Endpoint(resourceUrl);

    if (!probeResult.success) {
      return {
        success: false as const,
        url: resourceUrl,
        error: probeResult.error,
      };
    }

    const { advisory } = probeResult;

    if (advisory.authMode === 'siwx') {
      return {
        success: false as const,
        skipped: true as const,
        url: resourceUrl,
        error: 'SIWX auth-only endpoint (no payment requirements to index)',
        status: 402,
      };
    }

    if (!advisory.inputSchema) {
      return {
        success: false as const,
        skipped: true as const,
        url: resourceUrl,
        error:
          'Missing input schema (non-invocable endpoint skipped in strict mode)',
        status: 402,
      };
    }

    const result = await registerResource(resourceUrl, advisory);

    if (result.success) return result;

    return {
      success: false as const,
      url: resourceUrl,
      error: getRegistrationErrorMessage(result.error),
    };
  });

  const successfulResults: { url: string }[] = [];
  const failedResults: { url: string; error: string; status?: number }[] = [];
  const skippedResults: { url: string; error: string; status?: number }[] = [];
  let originId: string | undefined;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const resourceUrl = resources[i]?.url ?? 'unknown';

    if (!result) continue;

    if (result.status === 'fulfilled' && result.value) {
      const value = result.value;
      if ('success' in value && value.success) {
        successfulResults.push({ url: resourceUrl });
        if (!originId && 'resource' in value && value.resource?.origin?.id) {
          originId = value.resource.origin.id;
        }
      } else if (
        'success' in value &&
        !value.success &&
        'skipped' in value &&
        value.skipped === true
      ) {
        skippedResults.push({
          url: resourceUrl,
          error: value.error,
          status: 'status' in value ? value.status : undefined,
        });
      } else if ('success' in value && !value.success) {
        failedResults.push({
          url: resourceUrl,
          error: value.error,
          status: 'status' in value ? value.status : undefined,
        });
      }
    } else if (result.status === 'rejected') {
      failedResults.push({
        url: resourceUrl,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : 'Promise rejected',
      });
    }
  }

  let deprecated = 0;
  if (originId) {
    const activeResourceUrls = resources.map(r => r.url);
    deprecated = await deprecateStaleResources(originId, activeResourceUrls);
  }

  return {
    registered: successfulResults.length,
    failed: failedResults.length,
    skipped: skippedResults.length,
    deprecated,
    total: results.length,
    source,
    failedDetails: failedResults,
    skippedDetails: skippedResults,
    originId,
  };
}
