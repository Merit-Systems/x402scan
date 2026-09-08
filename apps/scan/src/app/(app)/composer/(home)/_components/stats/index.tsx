import React, { Suspense } from "react";

import { connection } from "next/server";
import { ErrorBoundary } from "react-error-boundary";

import { Section } from "@/app/(app)/_components/deferred/page-utils";
import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";
import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";
import { api, HydrateClient } from "@/trpc/server";
import { ActivityTimeframe } from "@/types/timeframes";

import { OverallCharts, LoadingOverallCharts } from "./charts";

export const OverallStats = () => {
  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.SevenDays}>
      <ActivityContainer>
        <ErrorBoundary
          fallback={<p>There was an error loading the activity data</p>}
        >
          <Suspense fallback={<LoadingOverallCharts />}>
            <Data />
          </Suspense>
        </ErrorBoundary>
      </ActivityContainer>
    </TimeRangeProvider>
  );
};

const ActivityContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="Overall Stats"
      description="Global agent usage on x402scan"
      actions={<RangeSelector />}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </Section>
  );
};

async function Data() {
  await connection();
  void api.public.agents.activity.overall.prefetch({
    timeframe: ActivityTimeframe.SevenDays,
  });
  void api.public.agents.activity.bucketed.prefetch({
    timeframe: ActivityTimeframe.SevenDays,
    numBuckets: 32,
  });
  return (
    <HydrateClient>
      <OverallCharts />
    </HydrateClient>
  );
}
