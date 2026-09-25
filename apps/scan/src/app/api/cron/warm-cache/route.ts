import { NextResponse } from "next/server";
import { createCaller } from "@/trpc/routers";
import { createTRPCContext } from "@/trpc/trpc";
import { DEFAULT_SELLERS_SORTING } from "@/lib/table-sort-options";
import { ACTIVITY_TIMEFRAMES } from "@/types/timeframes";
import type { ActivityTimeframe } from "@/types/timeframes";
import { facilitatorAddresses } from "@/lib/facilitators";
import { CACHE_DURATION_MINUTES } from "@/lib/cache/constants";
import { Chain } from "@/types/chain";

import type { NextRequest } from "next/server";
import { checkCronSecret } from "@/lib/cron";
import { env } from "@/env";

export const maxDuration = 300;

/**
 * Maximum number of concurrent cache warming requests
 * Helps prevent database connection pool exhaustion
 */
const MAX_CONCURRENT_REQUESTS = 20;

/**
 * Maximum number of retries per task
 */
const MAX_RETRIES = 3;

/**
 * Execute a task with retries
 */
async function withRetry<T>(
  task: () => Promise<T>,
  maxRetries: number,
  taskName?: string
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        console.warn(
          `[Cache Warming] ${taskName ? `${taskName}: ` : ""}Attempt ${String(attempt + 1)} failed, retrying... Error: ${lastError.message}`
        );
      }
    }
  }

  const errorMessage = `[Cache Warming] ${taskName ? `${taskName}: ` : ""}All ${String(maxRetries + 1)} attempts failed. Last error: ${String(lastError?.message)}`;
  console.error(errorMessage);
  throw lastError ?? new Error(errorMessage);
}

/**
 * Execute promises with controlled concurrency
 */
async function limitConcurrency(
  tasks: (() => Promise<unknown>)[],
  maxConcurrent: number
): Promise<void> {
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < tasks.length) {
      const taskIndex = index++;
      const task = tasks[taskIndex];
      if (!task) continue;
      await withRetry(task, MAX_RETRIES, `Task ${String(taskIndex + 1)}`);
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrent, tasks.length) },
    () => runNext()
  );

  await Promise.all(workers);
}

/**
 * Get cache warming tasks for the Homepage
 */
function getHomePageTasks(
  api: ReturnType<typeof createCaller>,
  timeframe: ActivityTimeframe,
  chain?: Chain
): (() => Promise<unknown>)[] {
  return [
    // Overall Stats - current period
    () =>
      api.public.stats.overall({
        timeframe,
        chain,
      }),

    // Bucketed Statistics - for charts
    () =>
      api.public.stats.bucketed({
        timeframe,
        numBuckets: 48,
        chain,
      }),

    // Discover page variant — bazaar.featured resolves the AgentCash catalog
    // origin set server-side, so the cache key omits the 305-element URL list.
    // Warms both getDiscoverOrigins() (its own Redis cache) and the
    // bazaar.list cache for the resulting input shape.
    () =>
      api.public.sellers.bazaar.featured({
        pagination: {
          page_size: 400,
        },
        timeframe,
        sorting: DEFAULT_SELLERS_SORTING,
        chain,
      }),
  ];
}

/**
 * Get cache warming tasks for the Networks Page
 */
function getNetworksPageTasks(
  api: ReturnType<typeof createCaller>,
  timeframe: ActivityTimeframe
): (() => Promise<unknown>)[] {
  return [
    // Networks bucketed statistics
    () =>
      api.networks.bucketedStatistics({
        numBuckets: 48,
        timeframe,
      }),

    // Networks list
    () =>
      api.networks.list({
        timeframe,
      }),

    // Overall stats already warmed by Home page (all chains variant)
  ];
}

/**
 * Get cache warming tasks for the Facilitators Page
 */
function getFacilitatorsPageTasks(
  api: ReturnType<typeof createCaller>,
  timeframe: ActivityTimeframe
): (() => Promise<unknown>)[] {
  return [
    // Facilitators bucketed statistics
    () =>
      api.public.facilitators.bucketedStatistics({
        numBuckets: 48,
        timeframe,
      }),

    // Facilitators list
    () =>
      api.public.facilitators.list({
        pagination: {
          page_size: facilitatorAddresses.length,
        },
        timeframe,
      }),

    // Overall stats already warmed by Networks page
  ];
}

/**
 * Page types that can be warmed
 */
type WarmablePage = "home" | "networks" | "facilitators";

const ALL_PAGES: WarmablePage[] = ["home", "networks", "facilitators"];

function isWarmablePage(value: string): value is WarmablePage {
  return ALL_PAGES.some((page) => page === value);
}

export async function GET(request: NextRequest) {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  try {
    const startTime = Date.now();

    // Create cache warming API with authenticated headers
    const warmingHeaders = new Headers();
    warmingHeaders.set("x-cache-warming", "true");
    warmingHeaders.set("authorization", `Bearer ${env.CRON_SECRET ?? ""}`);

    const ctx = await createTRPCContext(warmingHeaders);
    const api = createCaller(ctx);

    // Optional query params
    const { searchParams } = new URL(request.url);
    const pagesParam = searchParams.get("pages"); // e.g., "home,networks"
    const chainParam = searchParams.get("chain"); // e.g., "base", "solana", "all"

    const timeframesToWarm = ACTIVITY_TIMEFRAMES;

    // Filter pages if requested
    const pagesToWarm: WarmablePage[] = pagesParam
      ? pagesParam.split(",").filter(isWarmablePage)
      : ALL_PAGES;

    // Parse chain filter if provided
    const chainFilter: Chain | "all" | undefined = chainParam
      ? chainParam === "all"
        ? "all"
        : chainParam === (Chain.BASE as string)
          ? Chain.BASE
          : chainParam === (Chain.SOLANA as string)
            ? Chain.SOLANA
            : undefined
      : undefined;

    console.log(
      `[Cache Warming] Starting cache warm for ${String(timeframesToWarm.length)} timeframe${timeframesToWarm.length === 1 ? "" : "s"} and ${String(pagesToWarm.length)} page${pagesToWarm.length === 1 ? "" : "s"}: ${pagesToWarm.join(", ")}`
    );

    const allTasks: (() => Promise<unknown>)[] = [];

    for (const timeframe of timeframesToWarm) {
      if (pagesToWarm.includes("home")) {
        if (!chainFilter || chainFilter === "all") {
          allTasks.push(...getHomePageTasks(api, timeframe));
        }
        if (!chainFilter || chainFilter === Chain.BASE) {
          allTasks.push(...getHomePageTasks(api, timeframe, Chain.BASE));
        }
        if (!chainFilter || chainFilter === Chain.SOLANA) {
          allTasks.push(...getHomePageTasks(api, timeframe, Chain.SOLANA));
        }
      }

      if (pagesToWarm.includes("networks")) {
        allTasks.push(...getNetworksPageTasks(api, timeframe));
      }

      if (pagesToWarm.includes("facilitators")) {
        allTasks.push(...getFacilitatorsPageTasks(api, timeframe));
      }
    }

    console.log(
      `[Cache Warming] Collected ${String(allTasks.length)} tasks across all timeframes`
    );

    await limitConcurrency(allTasks, MAX_CONCURRENT_REQUESTS);

    const totalElapsed = Date.now() - startTime;
    const totalElapsedMinutes = totalElapsed / 1000 / 60;

    console.log(
      `[Cache Warming] Completed ${String(allTasks.length)} tasks in ${String(totalElapsed)}ms (${totalElapsedMinutes.toFixed(2)} minutes)`
    );

    const cacheDurationMs = CACHE_DURATION_MINUTES * 60 * 1000;
    if (totalElapsed > cacheDurationMs) {
      console.warn(
        `[Cache Warming] WARNING: Cache warming took ${totalElapsedMinutes.toFixed(2)} minutes, ` +
          `which exceeds CACHE_DURATION_MINUTES (${String(CACHE_DURATION_MINUTES)} minutes). ` +
          `This may cause cache misses between warming cycles.`
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: "Cache warmed successfully",
      tasksCompleted: allTasks.length,
      timeframesWarmed: timeframesToWarm.length,
      timings: {
        total: totalElapsed,
        totalMinutes: totalElapsedMinutes,
      },
      warning:
        totalElapsed > cacheDurationMs
          ? `Cache warming exceeded ${String(CACHE_DURATION_MINUTES)} minute interval`
          : undefined,
    });
  } catch (error) {
    console.error("[Cache Warming] Error warming cache:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
