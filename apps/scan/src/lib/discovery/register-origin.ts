import { Result, matchErrorPartial } from 'better-result';

import { probeX402Endpoint } from './probe';
import { type DiscoveryError } from './errors';
import { registerResource } from '@/lib/resources';
import { deprecateStaleResources } from '@/services/db/resources/resource';
import { getOriginResourceCount } from '@/services/db/resources/origin';
import { notifyNewServer } from '@/lib/discord-notifications';
import { getOriginFromUrl } from '@/lib/url';

import type { AuthMode } from '@agentcash/discovery';

const BULK_REGISTER_CONCURRENCY = 6;

type ResourceOutcome =
  | { kind: 'siwx'; url: string }
  | {
      kind: 'registered';
      url: string;
      originId: string;
      title: string | null;
      description: string | null;
    };

/**
 * Wire entry for a non-success per-resource outcome. `error` carries the full
 * serialized `DiscoveryError` (`{_tag, message, ...payload}`) so client-side
 * rendering can dispatch on `_tag` instead of string-matching.
 */
export interface FailedResourceEntry {
  url: string;
  error: DiscoveryError;
  status?: number;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency = BULK_REGISTER_CONCURRENCY
): Promise<R[]> {
  const results: (R | undefined)[] = Array.from({ length: items.length });
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;

      if (current >= items.length) return;
      const item = items[current] as T;
      results[current] = await mapper(item, current);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results.filter((r): r is R => r !== undefined);
}

export interface RegisterOriginResult {
  registered: number;
  siwx: number;
  failed: number;
  skipped: number;
  deprecated: number;
  total: number;
  source: string | undefined;
  failedDetails: FailedResourceEntry[];
  siwxDetails: { url: string }[];
  skippedDetails: FailedResourceEntry[];
  originId: string | undefined;
}

/**
 * Probe + register a single resource as a Result-returning generator. Errors
 * from probe and registerResource are auto-collected into the inferred error
 * union (DiscoveryError = ProbeError | RegisterError). The MissingInputSchema
 * guard is delegated to `registerResource` to keep one canonical site for it.
 */
async function probeAndRegister(resource: {
  url: string;
  authMode?: AuthMode;
}): Promise<Result<ResourceOutcome, DiscoveryError>> {
  return Result.gen(async function* () {
    if (resource.authMode === 'siwx') {
      return Result.ok<ResourceOutcome, never>({
        kind: 'siwx',
        url: resource.url,
      });
    }

    const probed = yield* Result.await(probeX402Endpoint(resource.url));

    if (probed.advisory.authMode === 'siwx') {
      return Result.ok<ResourceOutcome, never>({
        kind: 'siwx',
        url: resource.url,
      });
    }

    const registered = yield* Result.await(
      registerResource(resource.url, probed.advisory, {
        notifyNewServer: false,
      })
    );

    return Result.ok<ResourceOutcome, never>({
      kind: 'registered',
      url: resource.url,
      originId: registered.resource.origin.id,
      title: registered.registrationDetails.originMetadata.title ?? null,
      description:
        registered.registrationDetails.originMetadata.description ?? null,
    });
  });
}

interface Classification {
  bucket: 'failed' | 'skipped';
  status?: number;
}

/**
 * Classify a `DiscoveryError` into the bulk aggregator buckets. Uses
 * `matchErrorPartial` so the only special case (MissingInputSchema → skipped)
 * is named explicitly; everything else falls through to `failed`.
 */
function classifyFailure(error: DiscoveryError): Classification {
  return matchErrorPartial(
    error,
    {
      MissingInputSchema: (): Classification => ({
        bucket: 'skipped',
        status: 402,
      }),
    },
    (): Classification => ({ bucket: 'failed' })
  );
}

/**
 * Probe and register all resources from a discovery document.
 *
 * Paid resources are probed and written to the resources table. SIWX-identified
 * routes are surfaced via `siwxDetails` but not written to the DB (until schema
 * support lands). Endpoints missing an input schema are reported as `skipped`.
 * Resources from the same origin that are no longer in the list are deprecated.
 */
export async function registerResourcesFromDiscovery(
  resources: { url: string; authMode?: AuthMode }[],
  source: string | undefined
): Promise<RegisterOriginResult> {
  const originResourceCounts = new Map(
    await Promise.all(
      [
        ...new Set(resources.map(resource => getOriginFromUrl(resource.url))),
      ].map(
        async origin => [origin, await getOriginResourceCount(origin)] as const
      )
    )
  );

  const outcomes = await mapWithConcurrency(resources, probeAndRegister);

  const successfulResults: ResourceOutcome[] = [];
  const siwxResults: { url: string }[] = [];
  const failedResults: FailedResourceEntry[] = [];
  const skippedResults: FailedResourceEntry[] = [];
  let originId: string | undefined;

  for (let i = 0; i < outcomes.length; i++) {
    const outcome = outcomes[i];
    const resourceUrl = resources[i]?.url ?? 'unknown';

    if (!outcome) continue;

    if (Result.isOk(outcome)) {
      const value = outcome.value;
      if (value.kind === 'siwx') {
        siwxResults.push({ url: value.url });
      } else {
        successfulResults.push(value);
        originId ??= value.originId;
      }
      continue;
    }

    const { bucket, status } = classifyFailure(outcome.error);
    const entry: FailedResourceEntry = { url: resourceUrl, error: outcome.error };
    if (status !== undefined) entry.status = status;
    if (bucket === 'skipped') skippedResults.push(entry);
    else failedResults.push(entry);
  }

  let deprecated = 0;
  if (originId) {
    const activeResourceUrls = resources.map(r => r.url);
    deprecated = await deprecateStaleResources(originId, activeResourceUrls);
  }

  const notifiedOrigins = new Set<string>();
  for (const result of successfulResults) {
    if (result.kind !== 'registered') continue;
    const origin = getOriginFromUrl(result.url);

    if (
      originResourceCounts.get(origin) === 0 &&
      !notifiedOrigins.has(origin)
    ) {
      notifyNewServer({
        originId: result.originId,
        origin,
        title: result.title,
        description: result.description,
      });
      notifiedOrigins.add(origin);
    }
  }

  return {
    registered: successfulResults.filter(r => r.kind === 'registered').length,
    siwx: siwxResults.length,
    failed: failedResults.length,
    skipped: skippedResults.length,
    deprecated,
    total: outcomes.length,
    source,
    failedDetails: failedResults,
    siwxDetails: siwxResults,
    skippedDetails: skippedResults,
    originId,
  };
}
