import { NextResponse } from 'next/server';
import { subDays, differenceInSeconds, subSeconds } from 'date-fns';
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
 * Warm caches for the Homepage
 */
async function warmHomePage(startDate: Date, endDate: Date) {
  const limit = 100;

  await Promise.all([
    // Overall Stats - current period
    api.public.stats.overall({
      startDate,
      endDate,
    }),

    // Overall Stats - previous period (for comparison)
    api.public.stats.overall({
      startDate: subSeconds(startDate, differenceInSeconds(endDate, startDate)),
      endDate: startDate,
    }),

    // Bucketed Statistics - for charts
    api.public.stats.bucketed({
      startDate,
      endDate,
      numBuckets: 32,
    }),

    // Top Facilitators
    api.public.facilitators.list({
      pagination: {
        page_size: facilitatorAddresses.length,
      },
      startDate,
      endDate,
    }),

    // Top Servers (Bazaar) - list
    api.public.sellers.bazaar.list({
      pagination: {
        page_size: 100,
      },
      startDate,
      endDate,
      sorting: defaultSellersSorting,
    }),

    // Top Servers (Bazaar) - overall stats
    api.public.stats.bazaar.overall({
      startDate,
      endDate,
    }),

    // Latest Transactions
    api.public.transfers.list({
      pagination: {
        page_size: limit,
      },
      sorting: defaultTransfersSorting,
      startDate,
      endDate,
    }),

    // All Sellers
    api.public.sellers.all.list({
      pagination: {
        page_size: 100,
      },
      startDate,
      endDate,
      sorting: defaultSellersSorting,
    }),
  ]);
}

/**
 * Warm caches for the Networks Page
 */
async function warmNetworksPage(startDate: Date, endDate: Date) {
  await Promise.all([
    // Networks bucketed statistics
    api.networks.bucketedStatistics({
      numBuckets: 48,
      startDate,
      endDate,
    }),

    // Networks list
    api.networks.list({
      startDate,
      endDate,
    }),

    // Overall stats (shared with homepage)
    api.public.stats.overall({
      startDate,
      endDate,
    }),
  ]);
}

/**
 * Warm caches for the Facilitators Page
 */
async function warmFacilitatorsPage(startDate: Date, endDate: Date) {
  await Promise.all([
    // Facilitators bucketed statistics
    api.public.facilitators.bucketedStatistics({
      numBuckets: 48,
      startDate,
      endDate,
    }),

    // Facilitators list (shared with homepage)
    api.public.facilitators.list({
      pagination: {
        page_size: facilitatorAddresses.length,
      },
      startDate,
      endDate,
    }),

    // Overall stats (shared with homepage)
    api.public.stats.overall({
      startDate,
      endDate,
    }),
  ]);
}

/**
 * Warm caches for the Resources/Marketplace Page
 */
async function warmResourcesPage(startDate: Date, endDate: Date) {
  await Promise.all([
    // All Sellers stats
    api.public.sellers.all.stats.overall({
      startDate,
      endDate,
    }),

    api.public.sellers.all.stats.bucketed({
      startDate,
      endDate,
    }),

    // Bazaar Sellers stats (overall)
    api.public.sellers.bazaar.stats.overall({
      startDate,
      endDate,
    }),

    // Bazaar Sellers stats (bucketed)
    api.public.sellers.bazaar.stats.bucketed({
      startDate,
      endDate,
    }),

    // Marketplace carousels (5 different tag filters)
    // Most Used (no tags)
    api.public.sellers.bazaar.list({
      pagination: { page_size: 20 },
      startDate,
      endDate,
    }),

    // Search Servers
    api.public.sellers.bazaar.list({
      tags: ['Search'],
      pagination: { page_size: 20 },
      startDate,
      endDate,
    }),

    // Crypto Servers
    api.public.sellers.bazaar.list({
      tags: ['Crypto'],
      pagination: { page_size: 20 },
      startDate,
      endDate,
    }),

    // AI Servers (Utility tag)
    api.public.sellers.bazaar.list({
      tags: ['Utility'],
      pagination: { page_size: 20 },
      startDate,
      endDate,
    }),

    // Trading Servers
    api.public.sellers.bazaar.list({
      tags: ['Trading'],
      pagination: { page_size: 20 },
      startDate,
      endDate,
    }),
  ]);
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

    console.log(
      `[Cache Warming] Starting cache warm for ${CACHE_WARMABLE_TIMEFRAMES.length} timeframes`
    );

    // Warm each timeframe serially to avoid overwhelming the database
    for (const timeframe of CACHE_WARMABLE_TIMEFRAMES) {
      const timeframeStartTime = Date.now();

      // Calculate date range based on timeframe
      const startDate =
        timeframe === ActivityTimeframe.AllTime
          ? firstTransfer
          : subDays(endDate, timeframe);

      const timeframeName =
        timeframe === ActivityTimeframe.AllTime
          ? 'All Time'
          : timeframe === ActivityTimeframe.OneDay
            ? '1 Day'
            : `${timeframe} Days`;

      console.log(`[Cache Warming] Warming timeframe: ${timeframeName}`);

      // Warm all pages for this timeframe in parallel
      await Promise.all([
        warmHomePage(startDate, endDate),
        warmNetworksPage(startDate, endDate),
        warmFacilitatorsPage(startDate, endDate),
        warmResourcesPage(startDate, endDate),
      ]);

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
