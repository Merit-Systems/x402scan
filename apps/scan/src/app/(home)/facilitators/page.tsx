import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Card } from '@/components/ui/card';
import { api, HydrateClient } from '@/trpc/server';
import { Suspense } from 'react';
import {
  FacilitatorsChart,
  LoadingFacilitatorsChart,
} from './_components/chart';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { firstTransfer } from '@/services/facilitator/constants';
import { ActivityTimeframe } from '@/types/timeframes';
import {
  FacilitatorsTable,
  LoadingFacilitatorsTable,
} from './_components/facilitators';
import { FacilitatorsSortingProvider } from '@/app/_contexts/sorting/facilitators/provider';
import { defaultFacilitatorsSorting } from '@/app/_contexts/sorting/facilitators/default';
import { getChain } from '@/app/_lib/chain';
import { facilitators } from '@/lib/facilitators';
import { getSSRTimeRange } from '@/lib/server-time';

export default async function FacilitatorsPage({
  searchParams,
}: PageProps<'/facilitators'>) {
  const chain = await searchParams.then(params => getChain(params.chain));

  const { endDate, startDate } = getSSRTimeRange(
    ActivityTimeframe.OneDay,
    firstTransfer
  );

  await Promise.all([
    api.public.facilitators.bucketedStatistics.prefetch({
      numBuckets: 48,
      startDate,
      endDate,
      chain,
    }),
    api.public.stats.overall.prefetch({
      startDate,
      endDate,
      chain,
    }),
    api.public.facilitators.list.prefetch({
      pagination: {
        page_size: facilitators.length,
      },
      startDate,
      endDate,
      chain,
    }),
  ]);

  return (
    <HydrateClient>
      <TimeRangeProvider
        creationDate={firstTransfer}
        initialTimeframe={ActivityTimeframe.OneDay}
      >
        <FacilitatorsSortingProvider
          initialSorting={defaultFacilitatorsSorting}
        >
          <Heading
            title="Facilitators"
            description="Top facilitators processing x402 transactions"
            actions={<RangeSelector />}
          />
          <Body>
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
