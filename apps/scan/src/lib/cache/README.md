# Query caching

Database query owners use `cachedQuery(name, query, options)` from `query.ts`.
Arguments and results are inferred from the original query. SuperJSON preserves
Dates, BigInts, and nested results without per-field or pagination wrappers.
Authorization stays in the route/procedure before invoking cached queries.

Redis owns query freshness: most results expire after 30 minutes; the warming
cron refreshes its configured public queries every 15 minutes. Unwarmed queries
refresh on the first read after expiry. Tool-call activity uses a 30-second TTL.
Default current times are resolved inside the query; explicit dates and all
arguments participate in the key. Array order and exact dates are preserved.
Query expiration does not refresh the underlying materialized views.

`cachedQuery` calls `connection()` so reads happen at request time, under the
existing component-level Suspense boundaries. Cache Components and partial
prefetching still own the page shell/navigation. Database results are not also
stored in Next's remote cache.

Keys are versioned and hashed with the configured scan/transfers database URLs
and environment. Preview databases cannot reuse production results on shared
Redis. Credentials are never written into keys. Increment the namespace version
or query name when deploying an incompatible result shape against the same DB.

A miss takes a 30-second lease renewed every 10 seconds. Concurrent readers poll
at 50ms intervals; after 55 seconds they throw rather than start duplicate origin
queries. Crashed holders are retried through lock acquisition after lease expiry.
Publication and release atomically verify ownership. Redis outages before the
initial read fall back to the origin; failures after entering coordination fail
the request. Successful origin results are returned even if publication fails.
Lost connectivity or a paused process can still outlive a lease: this is cache
coordination, not exactly-once execution for writes.

The warming cron uses `refreshQueryCache` around its tasks. A refresh waiter
waits for a new publication; normal readers can still use the unexpired old
value. Completion means each task's query refresh finished, rather than merely
scheduling background work. Resource registration rotates the resources tag's
generation and revalidates the server page. In-flight older reads cannot
repopulate the new generation. Generation keys persist; superseded result keys
expire naturally without key scans.

The external discovery catalog retains its Next remote cache: failed/empty
upstream refreshes preserve a successful catalog for up to 24 hours, and cold
failures degrade to an empty list. Its warming read uses Next's revalidation
semantics. Redis also retains discovery probe sessions and resumable chat streams.
