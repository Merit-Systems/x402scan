# Disposable cache benchmark

This PR is an experiment above `json/native-navigation`. Drop the entire PR to
remove the endpoint, instrumentation, runner and uncached exports. Application
query inputs, cache lifetimes, authorization and SQL remain unchanged.

## Access and isolation

`GET /api/cache-benchmark` is available only when `VERCEL_ENV=preview` and a
32-character-or-longer `CACHE_BENCHMARK_TOKEN` is configured. Every request must
send `Authorization: Bearer <token>`. Missing/incorrect credentials, missing
configuration, and every other environment return 404. Use a dedicated secret
scoped to this preview Git branch, not the production cron secret.

The endpoint accepts a UUID `run`, one fixed `query`, and a `mode` (`next`,
`redis`, `uncached`). No caller-supplied SQL, addresses, database URLs, date ranges
or cache invalidation is supported. Responses are private/no-store and contain
only measurement metadata and a result digest, never query results. Never add
tokens to query strings, committed files, or log output.

Both cache modes wrap the same uncached application functions:

- overall one-day transfer statistics;
- one-day statistics chart (48 buckets);
- top ten sellers over one day (includes the count query);
- ten recent transfers over one day (Prisma).

All modes use this deployment's existing connection and replica/fallback policy.
No Neon configuration changes are required. This does not normalize random
replica selection or guarantee a frozen database snapshot; repeated runs and
source timestamps help distinguish data changes from cache differences.

Next uses `use cache: remote` with the application's 15-minute revalidation /
30-minute expiry profile. Its function and UUID run arguments isolate entries
from application caches. Redis uses `cache-benchmark:v1:<run>:<query>` keys with
30-minute TTL and the pre-migration lock/poll/fallback implementation. Missing
Redis fails rather than silently becoming an uncached test. No shared keys are
cleared. The first runner pass does not run the warming cron or force refreshes.

## Run

Set `CACHE_BENCHMARK_TOKEN` securely in the runner environment, then:

```sh
pnpm --filter @x402scan/app benchmark:cache https://DEPLOYMENT.vercel.app --dry-run
BENCHMARK_OUTPUT=/tmp/cache-results.json pnpm --filter @x402scan/app benchmark:cache https://DEPLOYMENT.vercel.app
```

The runner makes at most 300 requests: four queries, three modes, 20 initial
concurrent requests and five sequential warm reads. It rotates mode order,
validates the destination hostname, refuses redirects, uses timeouts and stops
subsequent groups on failure. Each request runs one fixed query function;
seller queries issue multiple SQL statements. This is a bounded experiment,
not a statistically reliable performance/load study.

A new UUID creates cold benchmark keys. Set `BENCHMARK_RUN_ID` to reuse a run
for refresh/expiration checks. Before calling an initial burst cold, confirm
that run has not been used on this deployment. Reuse after 15 minutes to inspect
Next revalidation versus Redis's retained entry, and after more than 30 minutes
without intermediate reads to inspect expiration. Next rebuilds may change
cache identity; record deployment IDs when comparing across deployments.

## Count the work

Every origin execution gets an execution ID; every database attempt gets an
attempt ID. JSON logs identify `benchmark: cache-v1`, run, mode, query and IDs.
They record starts, completions, duration and success. No SQL, parameters,
connection information, credentials or returned data are logged by the observer.
Ordinary application reads have no observer. Replica fallback attempts count
separately. Prisma instrumentation counts `findMany` operations; it cannot count
hidden driver retries or internal statements. Query duration includes transport
and is not a PostgreSQL execution-plan measurement.

Export logs for the exact preview deployment and the full test interval:

```sh
vercel logs DEPLOYMENT_ID --scope merit-systems --since 30m --limit 2000 --json > /tmp/cache-logs.jsonl
node apps/scan/scripts/cache-benchmark-logs.mjs RUN_ID /tmp/cache-logs.jsonl /tmp/cache-counts.json
```

The reducer deduplicates repeated Vercel log entries and counts execution and
attempt IDs. Check the log limit/window and incomplete starts/ends before
claiming exact totals. Retain aggregate outputs rather than publishing raw
platform logs. Cached response metadata describes the execution that produced
that entry, not work performed on the current request. Distinct IDs observed in
responses are only a lower bound: logs can reveal duplicate work whose result
was not returned.

`computedAgeMs` measures time since the cached query completed.
`sourceAgeMs` is available only for overall stats and measures the age of its
latest block timestamp. Neither is the materialized-view refresh timestamp.
Digests detect differing results but cannot distinguish refreshed data from an
implementation difference without controlling the data snapshot.

Compare end-to-end latency, actual captured query attempts, slow-miss duplication,
errors and data age. Billing, real production traffic, seller/spending coverage
beyond these fixtures and full refresh-cycle checks require further measurement.
Do not claim the backend migration is proven from warm latency alone.

## Cleanup

Drop this PR/branch, remove the branch-scoped `CACHE_BENCHMARK_TOKEN` variable,
and remove its preview deployments to disable the endpoint. Redis benchmark
keys expire on their own after 30 minutes; never flush the application database
or Redis instance. All test artifacts and scripts are disposable.
