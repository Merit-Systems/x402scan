import { Suspense } from 'react';

import { Card } from '@/components/ui/card';

import { Body, Heading } from '@/app/_components/layout/page-utils';

import {
  FacilitatorsChart,
  LoadingFacilitatorsChart,
} from './_components/chart';
import {
  FacilitatorsTable,
  LoadingFacilitatorsTable,
} from './_components/facilitators';

import { FacilitatorsSortingProvider } from '@/app/_contexts/sorting/facilitators/provider';
import { defaultFacilitatorsSorting } from '@/app/_contexts/sorting/facilitators/default';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';

import { api, HydrateClient } from '@/trpc/server';

import { getChainForPage } from '@/app/_lib/chain/page';

import { facilitators } from '@/lib/facilitators';

import { ActivityTimeframe } from '@/types/timeframes';
import { FacilitatorPackageBanner } from './_components/facilitator-package-banner';

export default async function FacilitatorsPage({
  searchParams,
}: PageProps<'/facilitators'>) {
  const chain = await getChainForPage(await searchParams);

  void api.public.facilitators.bucketedStatistics.prefetch({
    numBuckets: 48,
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });
  void api.public.stats.overallMV.prefetch({
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });
  void api.public.facilitators.list.prefetch({
    pagination: {
      page_size: facilitators.length,
    },
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });

  return (
    <HydrateClient>
      <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
        <FacilitatorsSortingProvider
          initialSorting={defaultFacilitatorsSorting}
        >
          <Heading
            title="Facilitators"
            description="Top facilitators processing x402 transactions"
            actions={<RangeSelector />}
          />
          <Body>
            <FacilitatorPackageBanner />
            <Card className="overflow-hidden">
              <Suspense fallback={<LoadingFacilitatorsChart />}>
                <FacilitatorsChart />
              </Suspense>
            </Card>
            <Suspense fallback={<LoadingFacilitatorsTable />}>
              <FacilitatorsTable />
            </Suspense>
          </Body>
        </FacilitatorsSortingProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
}
