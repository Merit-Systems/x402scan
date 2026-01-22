import React, { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { Section } from '@/app/_components/layout/page-utils';

import { OverallCharts, LoadingOverallCharts } from './charts';

import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';

import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';

import { ActivityTimeframe } from '@/types/timeframes';

// Note: No HydrateClient here - parent page.tsx provides it
// Prefetch is done in page.tsx
export const OverallStats = () => {
  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.SevenDays}>
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
