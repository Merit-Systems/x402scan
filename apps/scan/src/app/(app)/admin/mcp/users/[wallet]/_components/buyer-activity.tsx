'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { ActivityTimeframe } from '@/types/timeframes';

import {
  BuyerActivityCharts,
  LoadingBuyerActivityCharts,
} from './buyer-activity-charts';

interface Props {
  wallet: string;
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
        <h3 className="text-2xl font-bold">Buyer Activity</h3>
        {isLoading ? <Skeleton className="w-24 h-8" /> : <RangeSelector />}
      </div>
      <Card className="p-0 overflow-hidden relative">{children}</Card>
    </div>
  );
};

export const BuyerActivity: React.FC<Props> = ({ wallet }) => {
  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
      <ActivityContainer>
        <ErrorBoundary
          fallback={
            <div className="p-4 text-sm text-muted-foreground">
              There was an error loading the buyer activity data
            </div>
          }
        >
          <Suspense fallback={<LoadingBuyerActivityCharts />}>
            <BuyerActivityCharts wallet={wallet} />
          </Suspense>
        </ErrorBoundary>
      </ActivityContainer>
    </TimeRangeProvider>
  );
};

export const LoadingBuyerActivity = () => {
  return (
    <ActivityContainer isLoading>
      <LoadingBuyerActivityCharts />
    </ActivityContainer>
  );
};
