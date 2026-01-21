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

import { FacilitatorsSortingProvider } from '@/app/(app)/_contexts/sorting/facilitators/provider';
import { defaultFacilitatorsSorting } from '@/app/(app)/_contexts/sorting/facilitators/default';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';

import { api, HydrateClient } from '@/trpc/server';

import { getChainForPage } from '@/app/(app)/_lib/chain/page';

import { ActivityTimeframe } from '@/types/timeframes';

const PAGE_SIZE = 10;

export default async function FacilitatorsPage({
  searchParams,
}: PageProps<'/facilitators'>) {
  const chain = await getChainForPage(await searchParams);

  void api.public.facilitators.bucketedStatistics.prefetch({
    numBuckets: 48,
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });
  void api.public.stats.overall.prefetch({
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });
  void api.public.facilitators.list.prefetch({
    pagination: {
      page_size: PAGE_SIZE,
    },
    sorting: defaultFacilitatorsSorting,
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
            {/* <FacilitatorPackageBanner /> */}
            <Card className="overflow-hidden">
              <Suspense fallback={<LoadingFacilitatorsChart />}>
                <FacilitatorsChart />
              </Suspense>
            </Card>
            <Suspense
              fallback={<LoadingFacilitatorsTable pageSize={PAGE_SIZE} />}
            >
              <FacilitatorsTable pageSize={PAGE_SIZE} />
            </Suspense>
          </Body>
        </FacilitatorsSortingProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
}
