import { Body, Heading } from '@/app/_components/layout/page-utils';
import { Card } from '@/components/ui/card';
import { api, HydrateClient } from '@/trpc/server';
import { Suspense } from 'react';
import { NetworksChart, LoadingNetworksChart } from './_components/chart';
import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { firstTransfer } from '@/services/facilitator/constants';
import { ActivityTimeframe } from '@/types/timeframes';
import { NetworksTable, LoadingNetworksTable } from './_components/networks';
import { NetworksSortingProvider } from '@/app/_contexts/sorting/networks/provider';
import { defaultNetworksSorting } from '@/app/_contexts/sorting/networks/default';
import { getChain } from '@/app/_lib/chain';
import { getSSRTimeRange } from '@/lib/time-range';

export default async function NetworksPage({
  searchParams,
}: PageProps<'/networks'>) {
  const chain = await searchParams.then(params => getChain(params.chain));

  const { endDate, startDate } = getSSRTimeRange(
    ActivityTimeframe.OneDay,
    firstTransfer
  );

  await Promise.all([
    // Use MV for bucketed statistics (OneDay is supported)
    api.networks.bucketedStatisticsMv.prefetch({
      timeframe: ActivityTimeframe.OneDay,
      numBuckets: 48,
      chain,
    }),
    // Use MV for overall stats (OneDay is supported)
    api.public.stats.overallMv.prefetch({
      timeframe: ActivityTimeframe.OneDay,
      chain,
    }),
    // Use MV for networks list (OneDay is supported)
    api.networks.listMv.prefetch({
      timeframe: ActivityTimeframe.OneDay,
      chain,
    }),
  ]);

  return (
    <HydrateClient>
      <TimeRangeProvider
        initialTimeframe={ActivityTimeframe.OneDay}
      >
        <NetworksSortingProvider initialSorting={defaultNetworksSorting}>
          <Heading
            title="Networks"
            description="Top networks processing x402 transactions"
            actions={<RangeSelector />}
          />
          <Body>
            <Card className="overflow-hidden">
              <Suspense fallback={<LoadingNetworksChart />}>
                <NetworksChart />
              </Suspense>
            </Card>
            <Suspense fallback={<LoadingNetworksTable />}>
              <NetworksTable />
            </Suspense>
          </Body>
        </NetworksSortingProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
}
