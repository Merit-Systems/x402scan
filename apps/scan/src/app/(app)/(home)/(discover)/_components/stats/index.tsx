import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { OverallCharts, LoadingOverallCharts } from "./charts";

import { StatsCardGrid } from "@/components/stats-card-grid";
import { api } from "@/trpc/server";

import type { ActivityTimeframe } from "@/types/timeframes";

import type { Chain } from "@/types/chain";

interface Props {
  chain?: Chain;
  timeframe: ActivityTimeframe;
}

export function OverallStatsContent({ chain, timeframe }: Props) {
  void api.public.stats.overall.prefetch({
    timeframe,
    chain,
  });
  void api.public.stats.bucketed.prefetch({
    timeframe,
    numBuckets: 48,
    chain,
  });

  return (
    <ErrorBoundary
      fallback={<p>There was an error loading the activity data</p>}
    >
      <Suspense fallback={<LoadingOverallStatsContent />}>
        <StatsCardGrid className="grid-cols-2 md:grid-cols-4">
          <OverallCharts chain={chain} timeframe={timeframe} />
        </StatsCardGrid>
      </Suspense>
    </ErrorBoundary>
  );
}

export const LoadingOverallStatsContent = () => (
  <StatsCardGrid className="grid-cols-2 md:grid-cols-4">
    <LoadingOverallCharts />
  </StatsCardGrid>
);
