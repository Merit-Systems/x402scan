import React, { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { OverallCharts, LoadingOverallCharts } from "./charts";

import { api, HydrateClient } from "@/trpc/server";

import { ActivityTimeframe } from "@/types/timeframes";

import type { Chain } from "@/types/chain";

interface Props {
  chain?: Chain;
  initialTimeframe?: ActivityTimeframe;
}

export const OverallStatsContent: React.FC<Props> = ({
  chain,
  initialTimeframe = ActivityTimeframe.OneDay,
}) => {
  void api.public.stats.overall.prefetch({
    timeframe: initialTimeframe,
    chain,
  });
  void api.public.stats.bucketed.prefetch({
    timeframe: initialTimeframe,
    numBuckets: 48,
    chain,
  });

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={<p>There was an error loading the activity data</p>}
      >
        <Suspense fallback={<LoadingOverallStatsContent />}>
          <StatsGrid>
            <OverallCharts />
          </StatsGrid>
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
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
