import { cacheLife } from "next/cache";
import { createHash, randomUUID } from "node:crypto";
import { stringify } from "superjson";

import { QUERY_CACHE_LIFE } from "@/lib/cache/constants";
import { queryObservation } from "@/services/transfers/query-observation";
import {
  listTopSellersMVUncached,
  listTopSellersMVInputSchema,
} from "@/services/transfers/sellers/list-mv";
import { getBucketedStatisticsMVUncached } from "@/services/transfers/stats/bucketed-mv";
import { getOverallStatisticsMVUncached } from "@/services/transfers/stats/overall-mv";
import {
  listFacilitatorTransfersUncached,
  listFacilitatorTransfersInputSchema,
} from "@/services/transfers/transfers/list";

import { withRedisCache } from "./redis";

import type { z } from "zod";

import type { benchmarkInput } from "./input";

type BenchmarkInput = z.infer<typeof benchmarkInput>;
type BenchmarkEvent =
  | { event: "origin-start" }
  | { event: "origin-end"; ok: boolean; sqlAttempts: number; originMs: number }
  | ({ event: "sql" } & Parameters<
      NonNullable<ReturnType<typeof queryObservation.getStore>>
    >[0]);

async function readQuery(query: BenchmarkInput["query"]) {
  switch (query) {
    case "overall":
      return getOverallStatisticsMVUncached({ timeframe: 1 });
    case "bucketed":
      return getBucketedStatisticsMVUncached({ timeframe: 1, numBuckets: 48 });
    case "sellers":
      return listTopSellersMVUncached(
        listTopSellersMVInputSchema.parse({ timeframe: 1 }),
        { page: 0, page_size: 10 }
      );
    case "recent-transfers":
      return listFacilitatorTransfersUncached(
        listFacilitatorTransfersInputSchema.parse({ timeframe: 1 }),
        { page: 0, page_size: 10 }
      );
  }
}

async function execute(input: BenchmarkInput) {
  const executionId = randomUUID();
  const started = performance.now();
  let sqlAttempts = 0;
  const correlation = {
    run: input.run,
    query: input.query,
    mode: input.mode,
    executionId,
  };
  const log = (event: BenchmarkEvent) => {
    console.info(
      JSON.stringify({ benchmark: "cache-v1", ...correlation, ...event })
    );
  };
  log({ event: "origin-start" });
  return queryObservation.run(
    (event) => {
      if (event.phase === "start") sqlAttempts++;
      log({ event: "sql", ...event });
    },
    async () => {
      try {
        const value = await readQuery(input.query);
        const sourceTimestamp =
          input.query === "overall" && "latest_block_timestamp" in value
            ? (value.latest_block_timestamp?.toISOString() ?? null)
            : null;
        const result = {
          executionId,
          completedAt: Date.now(),
          sourceTimestamp,
          sqlAttempts,
          originMs: performance.now() - started,
          digest: createHash("sha256").update(stringify(value)).digest("hex"),
        };
        log({
          event: "origin-end",
          ok: true,
          sqlAttempts,
          originMs: result.originMs,
        });
        return result;
      } catch (error) {
        log({
          event: "origin-end",
          ok: false,
          sqlAttempts,
          originMs: performance.now() - started,
        });
        throw error;
      }
    }
  );
}

async function nextRead(
  run: BenchmarkInput["run"],
  query: BenchmarkInput["query"]
) {
  "use cache: remote";
  cacheLife(QUERY_CACHE_LIFE);
  // Unique run arguments isolate this cache from every application cache entry.
  return execute({ run, query, mode: "next" });
}

export function runBenchmark(input: BenchmarkInput) {
  switch (input.mode) {
    case "next":
      return nextRead(input.run, input.query);
    case "redis":
      return withRedisCache(
        `cache-benchmark:v1:${input.run}:${input.query}`,
        () => execute(input),
        QUERY_CACHE_LIFE.expire
      );
    case "uncached":
      return execute(input);
  }
}
