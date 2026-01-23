'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { ActivityTimeframe } from '@/types/timeframes';

import {
  ResourceUsageTable,
  LoadingResourceUsageTable,
} from './resource-usage-table';

interface Props {
  wallet: string;
}

const ResourceUsageContainer = ({
  children,
  isLoading = false,
}: {
  children: React.ReactNode;
  isLoading?: boolean;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          Spending by Server
        </CardTitle>
        {isLoading ? <Skeleton className="w-24 h-8" /> : <RangeSelector />}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
};

export const ResourceUsage: React.FC<Props> = ({ wallet }) => {
  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.SevenDays}>
      <ResourceUsageContainer>
        <ErrorBoundary
          fallback={
            <div className="p-4 text-sm text-muted-foreground">
              There was an error loading the resource usage data
            </div>
          }
        >
          <Suspense fallback={<LoadingResourceUsageTable />}>
            <ResourceUsageTable wallet={wallet} />
          </Suspense>
        </ErrorBoundary>
      </ResourceUsageContainer>
    </TimeRangeProvider>
  );
};

export const LoadingResourceUsage = () => {
  return (
    <ResourceUsageContainer isLoading>
      <LoadingResourceUsageTable />
    </ResourceUsageContainer>
  );
};
