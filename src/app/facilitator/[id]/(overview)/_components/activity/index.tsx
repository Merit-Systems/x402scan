import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { subDays } from 'date-fns';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';

import { ActivityCharts, LoadingActivityCharts } from './charts';

import { api, HydrateClient } from '@/trpc/server';

import { ActivityTimeframe } from '@/types/timeframes';
import type { Chain } from '@/types/chain';

interface Props {
  facilitatorId: string;
  chain?: Chain;
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

export const Activity: React.FC<Props> = async ({ facilitatorId }) => {
  const endDate = new Date();
  const startDate = subDays(endDate, 7);

  const [firstTransferTimestamp] = await Promise.all([
    api.public.stats.firstTransferTimestamp({
      facilitatorIds: [facilitatorId],
    }),
    api.public.stats.bucketed.prefetch({
      facilitatorIds: [facilitatorId],
      startDate,
      endDate,
    }),
    api.public.stats.overall.prefetch({
      facilitatorIds: [facilitatorId],
      startDate,
      endDate,
    }),
  ]);

  return (
    <HydrateClient>
      <TimeRangeProvider
        creationDate={firstTransferTimestamp ?? startDate}
        initialEndDate={endDate}
        initialStartDate={startDate}
        initialTimeframe={ActivityTimeframe.SevenDays}
      >
        <ActivityContainer>
          <ErrorBoundary
            fallback={<p>There was an error loading the activity data</p>}
          >
            <Suspense fallback={<LoadingActivityCharts />}>
              <ActivityCharts facilitatorId={facilitatorId} />
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
