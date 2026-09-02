import React, { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { OverallCharts, LoadingOverallCharts } from "./charts";

import { api } from "@/trpc/server";

import type { ActivityTimeframe } from "@/types/timeframes";

import type { Chain } from "@/types/chain";

interface Props {
  chain?: Chain;
  timeframe: ActivityTimeframe;
}

export const OverallStatsContent: React.FC<Props> = ({ chain, timeframe }) => {
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
        <StatsGrid>
          <OverallCharts chain={chain} timeframe={timeframe} />
        </StatsGrid>
      </Suspense>
    </ErrorBoundary>
  );
};

export const LoadingOverallStatsContent = () => (
  <StatsGrid>
    <LoadingOverallCharts />
  </StatsGrid>
);

const StatsGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>
);
