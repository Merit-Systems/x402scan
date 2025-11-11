import React, { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { Section } from '@/app/_components/layout/page-utils';

import { OverallCharts, LoadingOverallCharts } from './charts';

import { RangeSelector } from '@/app/_contexts/time-range/component';

import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';

import { api, HydrateClient } from '@/trpc/server';

import { firstTransfer } from '@/services/facilitator/constants';

import { ActivityTimeframe } from '@/types/timeframes';

import { getSSRTimeRange } from '@/lib/time-range';

export const OverallStats = async () => {
  const { endDate, startDate } = getSSRTimeRange(
    ActivityTimeframe.ThreeDays,
    firstTransfer
  );

  await Promise.all([
    api.public.agents.activity.overall.prefetch({
      startDate,
      endDate,
    }),
    api.public.agents.activity.bucketed.prefetch({
      startDate,
      endDate,
      numBuckets: 32,
    }),
  ]);

  return (
    <HydrateClient>
      <TimeRangeProvider
        initialTimeframe={ActivityTimeframe.ThreeDays}
      >
        <ActivityContainer>
          <ErrorBoundary
            fallback={<p>There was an error loading the activity data</p>}
          >
            <Suspense fallback={<LoadingOverallCharts />}>
              <OverallCharts />
            </Suspense>
          </ErrorBoundary>
        </ActivityContainer>
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

const ActivityContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="Overall Stats"
      description="Global agent usage on x402scan"
      actions={<RangeSelector />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </Section>
  );
};
