import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";

import { ActivityCharts, LoadingActivityCharts } from "./charts";

import { api, HydrateClient } from "@/trpc/server";

import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";

import { ActivityTimeframe } from "@/types/timeframes";

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
    <div className="flex w-full flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">Activity</h3>
        {isLoading ? <Skeleton className="h-8 w-24" /> : <RangeSelector />}
      </div>
      <Card className="relative overflow-hidden p-0">{children}</Card>
    </div>
  );
};

export const Activity: React.FC<Props> = async ({ address }) => {
  await Promise.all([
    api.public.buyers.all.stats.bucketed.prefetch({
      senders: {
        include: [address],
      },
      timeframe: ActivityTimeframe.OneDay,
    }),
    api.public.buyers.all.stats.overall.prefetch({
      senders: {
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
