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
import { Chain } from '@/types/chain';

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
 * Get cache warming tasks for the Homepage
 */
function getHomePageTasks(
  startDate: Date,
  endDate: Date,
  chain?: Chain,
  timeframe?: ActivityTimeframe
): (() => Promise<unknown>)[] {
  const limit = 100;

  // Check if we can use materialized views for this timeframe
  const canUseMV =
    timeframe &&
    [
      ActivityTimeframe.OneDay,
      ActivityTimeframe.SevenDays,
      ActivityTimeframe.FourteenDays,
      ActivityTimeframe.ThirtyDays,
    ].includes(timeframe);

  return [
    // Overall Stats - current period (use MV if available)
    () =>
      canUseMV
        ? api.public.stats.overallMv({
            timeframe,
            chain,
          })
        : api.public.stats.overall({
            startDate,
            endDate,
            chain,
          }),

    // Overall Stats - previous period (for comparison)
    () =>
      api.public.stats.overall({
        startDate: subSeconds(
          startDate,
          differenceInSeconds(endDate, startDate)
        ),
        endDate: startDate,
        chain,
      }),

    // Bucketed Statistics - for charts (use MV if available)
    () =>
      canUseMV
        ? api.public.stats.bucketedMv({
            timeframe,
            startDate,
            endDate,
            numBuckets: 48,
            chain,
          })
        : api.public.stats.bucketed({
            startDate,
            endDate,
            numBuckets: 48,
            chain,
          }),

    // Top Facilitators
    () =>
      api.public.facilitators.list({
        pagination: {
          page_size: facilitatorAddresses.length,
        },
        timeframe,
        chain,
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
        chain,
      }),

    // Top Servers (Bazaar) - overall stats
    () =>
      api.public.stats.bazaar.overall({
        startDate,
        endDate,
        chain,
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
        chain,
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
        chain,
      }),
  ];
}

/**
 * Get cache warming tasks for the Networks Page
 */
function getNetworksPageTasks(
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

    // Overall stats (shared with homepage)
    () =>
      api.public.stats.overall({
        timeframe,
      }),
  ];
}

/**
 * Get cache warming tasks for the Facilitators Page
 */
function getFacilitatorsPageTasks(
  timeframe: ActivityTimeframe
): (() => Promise<unknown>)[] {
  return [
    // Facilitators bucketed statistics
    () =>
      api.public.facilitators.bucketedStatistics({
        numBuckets: 48,
        timeframe,
      }),

    // Facilitators list (shared with homepage)
    () =>
      api.public.facilitators.list({
        pagination: {
          page_size: facilitatorAddresses.length,
        },
        timeframe,
      }),

    // Overall stats (shared with homepage)
    () =>
      api.public.stats.overallMv({
        timeframe,
      }),
  ];
}

/**
 * Get cache warming tasks for the Resources/Marketplace Page
 */
function getResourcesPageTasks(
  startDate: Date,
  endDate: Date
): (() => Promise<unknown>)[] {
  return [
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
  ];
}

/**
 * Page types that can be warmed
 */
type WarmablePage = 'home' | 'networks' | 'facilitators' | 'resources';

const ALL_PAGES: WarmablePage[] = [
  'home',
  'networks',
  'facilitators',
  'resources',
];

export async function GET(request: NextRequest) {
  const cronCheck = checkCronSecret(request);
  if (cronCheck) {
    return cronCheck;
  }

  try {
    const startTime = Date.now();
    const endDate = new Date();
    const timeframesWarmed: Record<string, number> = {};

    // Optional query params
    const { searchParams } = new URL(request.url);
    const onlyAllTime = searchParams.get('onlyAllTime') === 'true';
    const pagesParam = searchParams.get('pages'); // e.g., "home,networks"

    // Filter timeframes if requested
    const timeframesToWarm = onlyAllTime
      ? CACHE_WARMABLE_TIMEFRAMES.filter(tf => tf === ActivityTimeframe.AllTime)
      : CACHE_WARMABLE_TIMEFRAMES;

    // Filter pages if requested
    const pagesToWarm: WarmablePage[] = pagesParam
      ? (pagesParam
          .split(',')
          .filter(p => ALL_PAGES.includes(p as WarmablePage)) as WarmablePage[])
      : ALL_PAGES;

    console.log(
      `[Cache Warming] Starting cache warm for ${timeframesToWarm.length} timeframe${timeframesToWarm.length === 1 ? '' : 's'}${onlyAllTime ? ' (All Time only)' : ''} and ${pagesToWarm.length} page${pagesToWarm.length === 1 ? '' : 's'}: ${pagesToWarm.join(', ')}`
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

      // Collect all tasks from selected pages
      const allTasks: (() => Promise<unknown>)[] = [];

      if (pagesToWarm.includes('home')) {
        // Home page with all chain variants
        allTasks.push(
          ...getHomePageTasks(startDate, endDate, undefined, timeframe)
        ); // All chains
        allTasks.push(
          ...getHomePageTasks(startDate, endDate, Chain.BASE, timeframe)
        );
        allTasks.push(
          ...getHomePageTasks(startDate, endDate, Chain.SOLANA, timeframe)
        );
      }

      if (pagesToWarm.includes('networks')) {
        allTasks.push(...getNetworksPageTasks(timeframe));
      }

      if (pagesToWarm.includes('facilitators')) {
        allTasks.push(...getFacilitatorsPageTasks(timeframe));
      }

      if (pagesToWarm.includes('resources')) {
        allTasks.push(...getResourcesPageTasks(startDate, endDate));
      }

      // Run all tasks with controlled concurrency
      await limitConcurrency(allTasks, MAX_CONCURRENT_REQUESTS);

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
