import React, { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { OverallCharts, LoadingOverallCharts } from "./charts";

import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";
import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";

import { ChartModeSelector } from "@/app/(app)/_contexts/chart-mode/component";
import { ChartModeProvider } from "@/app/(app)/_contexts/chart-mode/provider";

import { api, HydrateClient } from "@/trpc/server";

import { ActivityTimeframe } from "@/types/timeframes";

import type { Chain } from "@/types/chain";

interface Props {
  chain?: Chain;
  initialTimeframe?: ActivityTimeframe;
}

export const OverallStats: React.FC<Props> = ({
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
      <TimeRangeProvider initialTimeframe={initialTimeframe}>
        <ChartModeProvider>
          <ActivityContainer controls>
            <ErrorBoundary
              fallback={<p>There was an error loading the activity data</p>}
            >
              <Suspense fallback={<LoadingOverallCharts />}>
                <OverallCharts />
              </Suspense>
            </ErrorBoundary>
          </ActivityContainer>
        </ChartModeProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
};

export const LoadingOverallStats = () => {
  return (
    <ActivityContainer>
      <LoadingOverallCharts />
    </ActivityContainer>
  );
};

const ActivityContainer = ({
  children,
  controls = false,
}: {
  children: React.ReactNode;
  controls?: boolean;
}) => {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="type-section-title">Usage</h2>
        {controls ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ChartModeSelector />
            <RangeSelector />
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>
    </section>
  );
};
