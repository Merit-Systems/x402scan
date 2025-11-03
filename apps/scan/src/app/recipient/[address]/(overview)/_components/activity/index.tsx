import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { subDays } from 'date-fns';

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
  const endDate = new Date();
  const startDate = subDays(endDate, 7);

  const [firstTransferTimestamp] = await Promise.all([
    api.public.stats.firstTransferTimestamp({
      recipients: {
        include: [address],
      },
    }),
    api.public.stats.bucketed({
      recipients: {
        include: [address],
      },
      startDate,
      endDate,
    }),
    api.public.stats.overall({
      recipients: {
        include: [address],
      },
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
