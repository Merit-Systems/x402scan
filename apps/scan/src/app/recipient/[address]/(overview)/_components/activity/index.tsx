import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';

import { ActivityCharts, LoadingActivityCharts } from './charts';

import { api, HydrateClient } from '@/trpc/server';

import { RangeSelector } from '@/app/_contexts/time-range/component';

import { ActivityTimeframe } from '@/types/timeframes';

interface Props {
  address: string;
}

const ActivityContainer = ({
  children,
  isLoading = false,
}: {
  children: React.ReactNode;
  isLoading?: boolean;
}) => {
  return (
    <div className="w-full flex flex-col gap-4 md:gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Activity</h3>
        {isLoading ? <Skeleton className="w-24 h-8" /> : <RangeSelector />}
      </div>
      <Card className="p-0 overflow-hidden relative">{children}</Card>
    </div>
  );
};

export const Activity: React.FC<Props> = async ({ address }) => {
  await Promise.all([
    api.public.stats.bucketed.prefetch({
      recipients: {
        include: [address],
      },
      timeframe: ActivityTimeframe.OneDay,
    }),
    api.public.stats.overall.prefetch({
      recipients: {
        include: [address],
      },
      timeframe: ActivityTimeframe.OneDay,
    }),
  ]);

  return (
    <HydrateClient>
      <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
        <ActivityContainer>
          <ErrorBoundary
            fallback={<p>There was an error loading the activity data</p>}
          >
            <Suspense fallback={<LoadingActivityCharts />}>
              <ActivityCharts address={address} />
            </Suspense>
          </ErrorBoundary>
        </ActivityContainer>
      </TimeRangeProvider>
    </HydrateClient>
  );
};

export const LoadingActivity = () => {
  return (
    <ActivityContainer isLoading>
      <LoadingActivityCharts />
    </ActivityContainer>
  );
};
