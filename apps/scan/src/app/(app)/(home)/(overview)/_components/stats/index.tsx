import React, { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { Section } from '@/app/_components/layout/page-utils';

import { OverallCharts, LoadingOverallCharts } from './charts';

import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';

import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';

import { ChartModeSelector } from '@/app/(app)/_contexts/chart-mode/component';
import { ChartModeProvider } from '@/app/(app)/_contexts/chart-mode/provider';

import { api, HydrateClient } from '@/trpc/server';

import { ActivityTimeframe } from '@/types/timeframes';

import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
  initialTimeframe?: ActivityTimeframe;
  /**
   * Wrap in a `HydrateClient` boundary (default). Pass `false` when a parent
   * already renders one: every `HydrateClient` dehydrates the *whole* shared
   * RSC query cache, so nested boundaries serialize every prefetched query
   * into the HTML payload once per boundary.
   */
  hydrate?: boolean;
}

/**
 * Kick off the queries `OverallStats` suspends on. Exported so a page that
 * owns the `HydrateClient` boundary can start them *before* the boundary
 * renders (dehydration snapshots the cache at that point).
 */
export const prefetchOverallStats = ({
  chain,
  initialTimeframe = ActivityTimeframe.OneDay,
}: Pick<Props, 'chain' | 'initialTimeframe'>) => {
  void api.public.stats.overall.prefetch({
    timeframe: initialTimeframe,
    chain,
  });
  void api.public.stats.bucketed.prefetch({
    timeframe: initialTimeframe,
    numBuckets: 48,
    chain,
  });
};

export const OverallStats: React.FC<Props> = ({
  chain,
  initialTimeframe = ActivityTimeframe.OneDay,
  hydrate = true,
}) => {
  prefetchOverallStats({ chain, initialTimeframe });

  const content = (
    <TimeRangeProvider initialTimeframe={initialTimeframe}>
      <ChartModeProvider>
        <ActivityContainer>
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
  );

  return hydrate ? <HydrateClient>{content}</HydrateClient> : content;
};

export const LoadingOverallStats = () => {
  return (
    <ActivityContainer>
      <LoadingOverallCharts />
    </ActivityContainer>
  );
};

const ActivityContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="Overall Stats"
      description="Global statistics for the x402 ecosystem"
      actions={
        <div className="flex items-center gap-2">
          <ChartModeSelector />
          <RangeSelector />
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </Section>
  );
};
