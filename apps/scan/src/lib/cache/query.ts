import { connection } from "next/server";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomUUID } from "node:crypto";
import { parse, stringify } from "superjson";

import { env } from "@/env";

import { getRedisClient } from "../redis";

// Preview databases must never reuse production results on the shared Redis.
const scope = createHash("sha256")
  .update(
    stringify([
      env.VERCEL_ENV ?? env.NODE_ENV,
      env.SCAN_DATABASE_URL,
      env.TRANSFERS_DB_URL,
    ])
  )
  .digest("hex");
const PREFIX = `query-cache:v1:${scope}`;
const LEASE_MS = 30_000;
const WAIT_MS = 55_000;
const refreshContext = new AsyncLocalStorage<boolean>();

// Ownership checks prevent an expired worker from deleting a successor's lock
// or publishing its older result over the successor's result.
const RELEASE = `if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1]) end return 0`;
const RENEW = `if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('PEXPIRE', KEYS[1], ARGV[2]) end return 0`;
const PUBLISH = `if redis.call('GET', KEYS[1]) == ARGV[1] then
  redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])
  redis.call('DEL', KEYS[1])
  return 1 end return 0`;

/** Options shared by query owners and the isolated cache benchmark. */
interface QueryCacheOptions {
  ttlSeconds?: number;
  tags?: string[];
  refresh?: boolean;
  /** Isolated experiments may supply a separate expiring namespace. */
  namespace?: string;
  fallbackToOrigin?: boolean;
}

/** Run warming reads in an explicit refresh scope, without changing query inputs. */
export function refreshQueryCache<T>(query: () => Promise<T>): Promise<T> {
  return refreshContext.run(true, query);
}

/** Rotate generations; in-flight readers can only populate their old generation. */
export async function invalidateQueryCacheTag(tag: string): Promise<void> {
  const redis = getRedisClient();
  if (redis) await redis.set(`${PREFIX}:tag:${tag}`, randomUUID());
}

/** Shared query results with renewable leases and bounded, non-duplicating waits. */
export async function readQueryCache<T>(
  name: string,
  args: unknown[],
  query: () => Promise<T>,
  {
    ttlSeconds = 1800,
    tags = [],
    refresh = false,
    namespace = PREFIX,
    fallbackToOrigin = true,
  }: QueryCacheOptions = {}
): Promise<T> {
  const redis = getRedisClient();
  if (!redis) {
    if (!fallbackToOrigin) throw new Error("Query cache Redis is unavailable");
    return query();
  }

  let key: string;
  let initial: string | null;
  try {
    const generations = await Promise.all(
      tags.map(async (tag) => {
        const tagKey = `${PREFIX}:tag:${tag}`;
        // Reinitialize evicted generations with a unique value, never a reused 0.
        await redis.set(tagKey, randomUUID(), "NX");
        return redis.get(tagKey);
      })
    );
    const digest = createHash("sha256")
      .update(stringify([args, generations]))
      .digest("hex");
    key = `${namespace}:${name}:${digest}`;
    initial = await redis.get(key);
    if (initial && !refresh) return parse<{ value: T }>(initial).value;
  } catch (error) {
    if (refresh || !fallbackToOrigin) throw error;
    console.warn("[Query cache] Read unavailable; querying origin", error);
    return query();
  }

  const lockKey = `${key}:lock`;
  const token = randomUUID();
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    // A refresh waiter must observe a new publication, not the stale value.
    const cached = await redis.get(key);
    if (cached && (!refresh || cached !== initial))
      return parse<{ value: T }>(cached).value;
    if ((await redis.set(lockKey, token, "PX", LEASE_MS, "NX")) === "OK") {
      let renewing = false;
      const timer = setInterval(() => {
        if (renewing) return;
        renewing = true;
        void redis
          .eval(RENEW, 1, lockKey, token, LEASE_MS)
          .catch(() => {
            console.warn("[Query cache] Lease renewal failed");
          })
          .finally(() => {
            renewing = false;
          });
      }, LEASE_MS / 3);
      timer.unref();
      try {
        // A previous holder may have published between our GET and SET NX.
        const latest = await redis.get(key);
        if (latest && (!refresh || latest !== initial))
          return parse<{ value: T }>(latest).value;
        const value = await query();
        try {
          const published = await redis.eval(
            PUBLISH,
            2,
            lockKey,
            key,
            token,
            stringify({ value, revision: randomUUID() }),
            ttlSeconds
          );
          if (refresh && published !== 1)
            throw new Error("Query cache refresh lost its lease");
        } catch (error) {
          if (refresh) throw error;
          // A successful origin read remains usable even when its cache write fails.
          console.warn("[Query cache] Publication failed", error);
        }
        return value;
      } finally {
        clearInterval(timer);
        await redis.eval(RELEASE, 1, lockKey, token).catch(() => {
          console.warn("[Query cache] Lease release failed");
        });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  // Never run a second origin query merely because another query is slow.
  throw new Error(`Timed out waiting for query cache: ${name}`);
}

/** Preserve the query's inferred arguments and result; Redis owns its freshness. */
export function cachedQuery<Args extends unknown[], Result>(
  name: string,
  query: (...args: Args) => Promise<Result>,
  options: Omit<
    QueryCacheOptions,
    "refresh" | "namespace" | "fallbackToOrigin"
  > = {}
) {
  return async (...args: Args): Promise<Result> => {
    await connection();
    return readQueryCache(name, args, () => query(...args), {
      ...options,
      refresh: refreshContext.getStore() ?? false,
    });
  };
}
