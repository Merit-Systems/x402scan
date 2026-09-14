import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { StatsCardGrid } from "@/components/stats-card-grid";

import {
  getBucketedStatisticsMV,
  bucketedStatisticsMVInputSchema,
} from "@/services/transfers/stats/bucketed-mv";
import {
  getOverallStatisticsMV,
  overallStatisticsMVInputSchema,
} from "@/services/transfers/stats/overall-mv";

import { OverallCharts, LoadingOverallCharts } from "./charts";

import type { Chain } from "@/types/chain";
import type { ActivityTimeframe } from "@/types/timeframes";

interface Props {
  chain?: Chain;
  timeframe: ActivityTimeframe;
}

export function OverallStatsContent({ chain, timeframe }: Props) {
  return (
    <ErrorBoundary
      key={`${chain ?? "all"}:${String(timeframe)}`}
      fallback={<p>There was an error loading the activity data</p>}
    >
      <Suspense fallback={<LoadingOverallStatsContent />}>
        <StatisticsData chain={chain} timeframe={timeframe} />
      </Suspense>
    </ErrorBoundary>
  );
}

export const LoadingOverallStatsContent = () => (
  <StatsCardGrid className="grid-cols-2 md:grid-cols-4">
    <LoadingOverallCharts />
  </StatsCardGrid>
);

async function StatisticsData({ chain, timeframe }: Props) {
  const [overallStats, bucketedStats] = await Promise.all([
    getOverallStatisticsMV(
      overallStatisticsMVInputSchema.parse({ chain, timeframe })
    ),
    getBucketedStatisticsMV(
      bucketedStatisticsMVInputSchema.parse({
        chain,
        timeframe,
        numBuckets: 48,
      })
    ),
  ]);
  return (
    <StatsCardGrid className="grid-cols-2 md:grid-cols-4">
      <OverallCharts
        overallStats={overallStats}
        bucketedStats={bucketedStats}
      />
    </StatsCardGrid>
  );
}
