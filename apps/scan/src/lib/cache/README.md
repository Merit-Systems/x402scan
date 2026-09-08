# Query caching

Query owners declare `"use cache: remote"`, `cacheLife`, and `cacheTag` directly
around database or catalog reads. Next owns cache keys and serialization;
arguments must be serializable query inputs, never request headers or sessions.
Authorization stays in the route/procedure before calling a cached function.

Most queries revalidate after 15 minutes and expire after 30 minutes. Cache
lifetimes are separate from the materialized-view refresh schedule: refreshing
a query does not refresh a database view. Explicit date ranges are cache inputs;
default current times must be resolved inside the cached computation.

On Vercel, remote caching uses the platform handler. Local/self-hosted Next
requires an appropriate cache handler for shared persistence. A local test of
`cacheLife` does not establish cross-instance behavior.

The warming cron is retained. It makes ordinary reads, which populate missing
entries or trigger stale revalidation. It does not bypass caches, and completion
does not mean every background refresh has finished. Reassess warming after
measuring cold-query latency and database concurrency in a deployed environment.

Discovery keeps successful catalogs eligible for stale serving for up to 24
hours. Its cached loader throws on failed/empty upstream results; the public
wrapper returns an empty list on cold failure outside the cache boundary.
Registration invalidates the `resources` tag with stale-while-revalidate semantics
and revalidates the affected server page.

Redis remains for discovery probe sessions and resumable chat streams. These
are workflow state, not reusable query results.
