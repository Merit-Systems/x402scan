import { NextResponse } from 'next/server';
import { subDays, subMinutes, differenceInSeconds, subSeconds } from 'date-fns';
import { api } from '@/trpc/server';
import { defaultSellersSorting } from '@/app/_contexts/sorting/sellers/default';
import { defaultTransfersSorting } from '@/app/_contexts/sorting/transfers/default';
import {
  CACHE_WARMABLE_TIMEFRAMES,
  ActivityTimeframe,
} from '@/types/timeframes';
import { firstTransfer } from '@/services/facilitator/constants';
import { facilitatorAddresses } from '@/lib/facilitators';
import { CACHE_DURATION_MINUTES } from '@/lib/cache-constants';

import type { NextRequest } from 'next/server';
import { checkCronSecret } from '@/lib/cron';

/**
 * Maximum number of concurrent cache warming requests
 * Helps prevent database connection pool exhaustion
 */
const MAX_CONCURRENT_REQUESTS = 10;

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
          `[Cache Warming] ${taskName ? `${taskName}: ` : ''}Attempt ${attempt + 1} failed, retrying... Error: ${lastError.message}`
        );
      }
    }
  }

  const errorMessage = `[Cache Warming] ${taskName ? `${taskName}: ` : ''}All ${maxRetries + 1} attempts failed. Last error: ${lastError?.message}`;
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
      await withRetry(tasks[taskIndex], MAX_RETRIES, `Task ${taskIndex + 1}`);
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrent, tasks.length) },
    () => runNext()
  );

  await Promise.all(workers);
}

/**
 * Warm caches for the Homepage
 */
async function warmHomePage(startDate: Date, endDate: Date) {
  const limit = 100;

  await limitConcurrency(
    [
      // Overall Stats - current period
      () =>
        api.public.stats.overall({
          startDate,
          endDate,
        }),

      // Overall Stats - previous period (for comparison)
      () =>
        api.public.stats.overall({
          startDate: subSeconds(
            startDate,
            differenceInSeconds(endDate, startDate)
          ),
          endDate: startDate,
        }),

      // Bucketed Statistics - for charts
      () =>
        api.public.stats.bucketed({
          startDate,
          endDate,
          numBuckets: 32,
        }),

      // Top Facilitators
      () =>
        api.public.facilitators.list({
          pagination: {
            page_size: facilitatorAddresses.length,
          },
          startDate,
          endDate,
        }),

      // Top Servers (Bazaar) - list
      () =>
        api.public.sellers.bazaar.list({
          pagination: {
            page_size: 100,
          },
          startDate,
          endDate,
          sorting: defaultSellersSorting,
        }),

      // Top Servers (Bazaar) - overall stats
      () =>
        api.public.stats.bazaar.overall({
          startDate,
          endDate,
        }),

      // Latest Transactions
      () =>
        api.public.transfers.list({
          pagination: {
            page_size: limit,
          },
          sorting: defaultTransfersSorting,
          startDate,
          endDate,
        }),

      // All Sellers
      () =>
        api.public.sellers.all.list({
          pagination: {
            page_size: 100,
          },
          startDate,
          endDate,
          sorting: defaultSellersSorting,
        }),
    ],
    MAX_CONCURRENT_REQUESTS
  );
}

/**
 * Warm caches for the Networks Page
 */
async function warmNetworksPage(startDate: Date, endDate: Date) {
  await limitConcurrency(
    [
      // Networks bucketed statistics
      () =>
        api.networks.bucketedStatistics({
          numBuckets: 48,
          startDate,
          endDate,
        }),

      // Networks list
      () =>
        api.networks.list({
          startDate,
          endDate,
        }),

      // Overall stats (shared with homepage)
      () =>
        api.public.stats.overall({
          startDate,
          endDate,
        }),
    ],
    MAX_CONCURRENT_REQUESTS
  );
}

/**
 * Warm caches for the Facilitators Page
 */
async function warmFacilitatorsPage(startDate: Date, endDate: Date) {
  await limitConcurrency(
    [
      // Facilitators bucketed statistics
      () =>
        api.public.facilitators.bucketedStatistics({
          numBuckets: 48,
          startDate,
          endDate,
        }),

      // Facilitators list (shared with homepage)
      () =>
        api.public.facilitators.list({
          pagination: {
            page_size: facilitatorAddresses.length,
          },
          startDate,
          endDate,
        }),

      // Overall stats (shared with homepage)
      () =>
        api.public.stats.overall({
          startDate,
          endDate,
        }),
    ],
    MAX_CONCURRENT_REQUESTS
  );
}

/**
 * Warm caches for the Resources/Marketplace Page
 */
async function warmResourcesPage(startDate: Date, endDate: Date) {
  await limitConcurrency(
    [
      // All Sellers stats
      () =>
        api.public.sellers.all.stats.overall({
          startDate,
          endDate,
        }),

      () =>
        api.public.sellers.all.stats.bucketed({
          startDate,
          endDate,
        }),

      // Bazaar Sellers stats (overall)
      () =>
        api.public.sellers.bazaar.stats.overall({
          startDate,
          endDate,
        }),

      // Bazaar Sellers stats (bucketed)
      () =>
        api.public.sellers.bazaar.stats.bucketed({
          startDate,
          endDate,
        }),

      // Marketplace carousels (5 different tag filters)
      // Most Used (no tags)
      () =>
        api.public.sellers.bazaar.list({
          pagination: { page_size: 20 },
          startDate,
          endDate,
        }),

      // Search Servers
      () =>
        api.public.sellers.bazaar.list({
          tags: ['Search'],
          pagination: { page_size: 20 },
          startDate,
          endDate,
        }),

      // Crypto Servers
      () =>
        api.public.sellers.bazaar.list({
          tags: ['Crypto'],
          pagination: { page_size: 20 },
          startDate,
          endDate,
        }),

      // AI Servers (Utility tag)
      () =>
        api.public.sellers.bazaar.list({
          tags: ['Utility'],
          pagination: { page_size: 20 },
          startDate,
          endDate,
        }),

      // Trading Servers
      () =>
        api.public.sellers.bazaar.list({
          tags: ['Trading'],
          pagination: { page_size: 20 },
          startDate,
          endDate,
        }),
    ],
    MAX_CONCURRENT_REQUESTS
  );
}

export async function GET(request: NextRequest) {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  try {
    const startTime = Date.now();
    const endDate = new Date();
    const timeframesWarmed: Record<string, number> = {};

    // Optional query param to filter to specific timeframes
    const { searchParams } = new URL(request.url);
    const onlyAllTime = searchParams.get('onlyAllTime') === 'true';

    // Filter timeframes if requested
    const timeframesToWarm = onlyAllTime
      ? CACHE_WARMABLE_TIMEFRAMES.filter(tf => tf === ActivityTimeframe.AllTime)
      : CACHE_WARMABLE_TIMEFRAMES;

    console.log(
      `[Cache Warming] Starting cache warm for ${timeframesToWarm.length} timeframe${timeframesToWarm.length === 1 ? '' : 's'}${onlyAllTime ? ' (All Time only)' : ''}`
    );

    // Warm each timeframe serially to avoid overwhelming the database
    for (const timeframe of timeframesToWarm) {
      const timeframeStartTime = Date.now();

      // Calculate date range based on timeframe
      // Note: For All Time, we lag firstTransfer by CACHE_DURATION_MINUTES because
      // the frontend applies this lag when computing relative timeframes.
      const startDate =
        timeframe === ActivityTimeframe.AllTime
          ? subMinutes(firstTransfer, CACHE_DURATION_MINUTES)
          : subDays(endDate, timeframe);

      const timeframeName =
        timeframe === ActivityTimeframe.AllTime
          ? 'All Time'
          : timeframe === ActivityTimeframe.OneDay
            ? '1 Day'
            : `${timeframe} Days`;

      console.log(`[Cache Warming] Warming timeframe: ${timeframeName}`);

      // Warm all pages for this timeframe with controlled concurrency
      await limitConcurrency(
        [
          () => warmHomePage(startDate, endDate),
          () => warmNetworksPage(startDate, endDate),
          () => warmFacilitatorsPage(startDate, endDate),
          () => warmResourcesPage(startDate, endDate),
        ],
        MAX_CONCURRENT_REQUESTS
      );

      const timeframeElapsed = Date.now() - timeframeStartTime;
      timeframesWarmed[timeframeName] = timeframeElapsed;
      console.log(
        `[Cache Warming] Completed ${timeframeName} in ${timeframeElapsed}ms`
      );
    }

    const totalElapsed = Date.now() - startTime;
    const totalElapsedMinutes = totalElapsed / 1000 / 60;

    console.log(
      `[Cache Warming] Completed all timeframes in ${totalElapsed}ms (${totalElapsedMinutes.toFixed(2)} minutes)`
    );

    // Warn if cache warming took longer than the cache duration
    const cacheDurationMs = CACHE_DURATION_MINUTES * 60 * 1000;
    if (totalElapsed > cacheDurationMs) {
      console.warn(
        `[Cache Warming] WARNING: Cache warming took ${totalElapsedMinutes.toFixed(2)} minutes, ` +
          `which exceeds CACHE_DURATION_MINUTES (${CACHE_DURATION_MINUTES} minutes). ` +
          `This may cause cache misses between warming cycles. Consider optimizing queries or increasing the interval.`
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Cache warmed successfully',
      timeframesWarmed: Object.keys(timeframesWarmed).length,
      timings: {
        total: totalElapsed,
        totalMinutes: totalElapsedMinutes,
        byTimeframe: timeframesWarmed,
      },
      warning:
        totalElapsed > cacheDurationMs
          ? `Cache warming exceeded ${CACHE_DURATION_MINUTES} minute interval`
          : undefined,
    });
  } catch (error) {
    console.error('[Cache Warming] Error warming cache:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
