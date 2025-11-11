import React, { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { differenceInSeconds, subSeconds } from 'date-fns';

import { Section } from '@/app/_components/layout/page-utils';

import { OverallCharts, LoadingOverallCharts } from './charts';

import { RangeSelector } from '@/app/_contexts/time-range/component';

import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';

import { api, HydrateClient } from '@/trpc/server';

import { firstTransfer } from '@/services/facilitator/constants';

import { ActivityTimeframe } from '@/types/timeframes';

import { getSSRTimeRange } from '@/lib/time-range';

import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const OverallStats = async ({ chain }: Props) => {
  const { endDate, startDate } = getSSRTimeRange(
    ActivityTimeframe.OneDay,
    firstTransfer
  );

  void api.public.stats.overall.prefetch({
    startDate,
    endDate,
    chain,
  });
  void api.public.stats.overall.prefetch({
    startDate: subSeconds(startDate, differenceInSeconds(endDate, startDate)),
    endDate: startDate,
    chain,
  });
  void api.public.stats.bucketed.prefetch({
    startDate,
    endDate,
    numBuckets: 32,
    chain,
  });

  return (
    <HydrateClient>
      <TimeRangeProvider
        initialTimeframe={ActivityTimeframe.OneDay}
        creationDate={firstTransfer}
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
      description="Global statistics for the x402 ecosystem"
      actions={<RangeSelector />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </Section>
  );
};
