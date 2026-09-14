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
from application caches. Redis uses isolated `cache-benchmark:v2:*` keys with
30-minute TTL and the same minimal query-cache helper as the application stack.
The query name and hashed run arguments determine the key. No tag generation
keys are created by this experiment. Missing
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

Use `--modes=uncached,next` to test only the available modes when Redis is
intentionally disabled. The default runs all three and fails closed if Redis
is unavailable; never silently treat an uncached read as a Redis result.

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
node apps/scan/scripts/cache-benchmark-export-logs.mjs DEPLOYMENT_ID RUN_ID /tmp/cache-logs.jsonl 30m
node apps/scan/scripts/cache-benchmark-logs.mjs RUN_ID /tmp/cache-logs.jsonl /tmp/cache-counts.json
```

The exporter uses overlapping timestamp windows because the installed Vercel
CLI repeated its first 50 records when asked for a larger limit. It preserves
partial evidence, bounds pagination, and fails on ambiguous/no-progress pages.
Use an explicit start timestamp instead of `30m` for older runs.

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

## Recorded preview result — September 14, 2026

Tested commit `dfa639d7`, deployment `dpl_7zEaaWKowb7LJpigcKekFpdL6AmD`,
run `93be62ca-8f16-488f-864e-be899ad1dc8e`. All 200 requests in the
Next-versus-uncached comparison succeeded. The complete timestamp-paginated
export contained 166 distinct origin executions, all with completions and no
query failures; these matched the execution IDs returned to the runner.

Each mode received a 20-request initial burst followed by five serial reads.
Next's origin executions all belonged to the initial burst; the five subsequent
reads reused the cached result. Sellers issue two SQL queries per execution.

| Query            | Next cold executions / 20 requests | Next query attempts, entire group | Uncached query attempts / 25 requests | Uncached warm HTTP median | Next warm HTTP median |
| ---------------- | ---------------------------------: | --------------------------------: | ------------------------------------: | ------------------------: | --------------------: |
| Overall stats    |                                 15 |                                15 |                                    25 |                     66 ms |                 53 ms |
| Stats chart      |                                 19 |                                19 |                                    25 |                     49 ms |                 47 ms |
| Sellers          |                                 13 |                                26 |                                    50 |                     60 ms |                 55 ms |
| Recent transfers |                                 19 |                                19 |                                    25 |                     52 ms |                 43 ms |

For the five warm uncached reads, median observed database-operation time was
10.3 ms (overall), 5.8 ms (chart), 15.0 ms (sellers, both queries), and 7.0 ms
(recent transfers). These include transport/adapter time and are not SQL
execution-plan measurements. Small samples and differing instance warm-up mean
the latency columns should not be treated as a causal speed ranking.

This establishes that the tested Vercel remote cache reused warm results but
did not collapse a cold burst to one execution. It also shows inexpensive warm
reads for these particular inputs. It does not establish production load limits,
Redis performance, costs, or freshness across a full cache lifecycle.

The project has a Redis URL shared across production/preview/development and a
preview-specific REDIS_DISABLE setting. The first all-mode run stopped when
Redis was unavailable. After that initial run, the user authorized a branch-only
override using isolated expiring keys; the three-mode result follows below.
No Neon settings were changed.

Aggregate measurements are checked in beside this document as
`cache-benchmark-results-2026-09-14.json`; raw platform logs and credentials are
not committed. The JSON records the exact tested deployment and the remaining
limitations.

## Three-mode result after authorized Redis enablement

The user authorized use of the existing shared Redis instance. Only
`json/cache-benchmark` received a `REDIS_DISABLE` override. Its value is an empty
string because the current `z.coerce.boolean()` parser treats nonempty strings
(including `"false"`) as true. The inherited preview setting and production
settings were not changed. The benchmark was redeployed with the override.

Tested commit `ed22008d`, deployment `dpl_J4MpEsAJaj32fWeTz4yTf2xTMcJu`,
run `36fc2c53-99bf-4a3e-85ae-785b9149d90f`. All 300 benchmark requests succeeded.
For each query, payload digests matched across all requests and all three modes.
The complete log export confirmed every recorded origin/query start had a
completion, with no failures or unreturned extra origin executions.

| Query            | Redis cold executions / 20 | Next cold executions / 20 | Uncached cold executions / 20 | Redis warm HTTP median | Next warm HTTP median | Uncached warm HTTP median |
| ---------------- | -------------------------: | ------------------------: | ----------------------------: | ---------------------: | --------------------: | ------------------------: |
| Overall stats    |                          1 |                        18 |                            20 |                  49 ms |                 61 ms |                     60 ms |
| Stats chart      |                          1 |                        19 |                            20 |                  47 ms |                 55 ms |                     55 ms |
| Sellers          |                          1 |                        19 |                            20 |                  40 ms |                 57 ms |                     59 ms |
| Recent transfers |                          1 |                        16 |                            20 |                  41 ms |                 51 ms |                     48 ms |

Across each mode's 100 requests (four cold bursts plus five warm reads per
query), Redis performed **5 database attempts**, Next **91**, and uncached
reads **125**. Sellers account for two SQL attempts per execution. Both caches
performed no additional query work for their five warm reads. Prisma counts
operations, not hidden adapter-internal statements.

Redis's cold-burst median HTTP times were 106–171 ms, versus 58–98 ms for Next.
The old Redis wrapper waits in 100 ms polling intervals while one caller fills
the key, which is a real latency-versus-duplicate-work tradeoff. Different
instance warm-up and small samples prevent treating these times as a stable
performance ranking. The uncached first bursts also include initialization.

This run supports retaining Redis's cold-miss coordination if avoiding duplicate
database work is a requirement: Next remote caching did not provide equivalent
coalescing in this deployment. It does not prove that all these cheap queries
need caching, establish costs, or cover refresh/expiry and slow-query behavior.
The earlier local 11-second callback test showed the old Redis wrapper also
falls back to duplicate work after its 10-second waiter limit.

The full aggregate results are in
`cache-benchmark-redis-results-2026-09-14.json`. These historical results used
the old Redis wrapper. The application stack now restores a minimal Redis helper;
the current benchmark uses that helper directly rather than maintaining a copy.

## Minimal Redis helper regression verification

The shared helper renews a 30-second lease every 10 seconds, checks ownership
atomically on publication/release, and bounds waiters at 55 seconds without the
old duplicate-query fallback. Eleven unit tests cover slow concurrent reads,
refresh waiters, expiration, resource invalidation races, lease loss, failed
publication, origin errors, Redis outages, and orphan recovery.

A fresh local Redis instance also served twenty concurrent 40-second reads with
exactly one origin execution. The real Lua scripts renewed the lease beyond its
initial lifetime, and Date/BigInt values survived cached round trips. No Neon or
shared Redis configuration was involved in this local test.

A new preview run tested commit `ec58a8d6`, deployment
`dpl_CZDmy7UvuH6URcC9FDZuBFCTHdFv`, run
`9ecfdd72-8253-4204-b16b-f6af9962e483`. All 300 requests succeeded, with matching
payload digests for every query across all modes. The complete paginated log
export matched all 175 distinct returned origin executions, with no extra
unreturned executions, missing completions, or query failures.

| Query | Redis cold executions / 20 | Next cold executions / 20 | Redis warm median | Next warm median | Uncached warm median |
| --- | ---: | ---: | ---: | ---: | ---: |
| Overall stats | 1 | 18 | 45 ms | 49 ms | 69 ms |
| Stats chart | 1 | 18 | 47 ms | 42 ms | 51 ms |
| Sellers | 1 | 18 | 41 ms | 44 ms | 77 ms |
| Recent transfers | 1 | 17 | 41 ms | 57 ms | 52 ms |

Across 100 requests per mode, the new Redis helper made **5 database attempts**,
Next **89**, and uncached reads **125**. Both caches avoided additional origin
reads in their five-request warm phase. Redis cold medians ranged from 55–114 ms.
The small sample and instance warm-up still prevent a stable latency ranking.

This verifies the replacement's deployed cold-miss coordination for these four
queries. Refresh/expiry, production capacity, billing, and cross-deployment
persistence remain outside this run. Slow-query renewal was verified locally,
not against a deliberately slowed hosted database. Aggregate results are in
`cache-benchmark-minimal-redis-results-2026-09-14.json`.

## Cleanup

Drop this PR/branch, remove the branch-scoped `CACHE_BENCHMARK_TOKEN` and `REDIS_DISABLE` overrides,
and remove its preview deployments to disable the endpoint. Redis benchmark
keys expire on their own after 30 minutes; never flush the application database
or Redis instance. All test artifacts and scripts are disposable.
