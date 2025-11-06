import { Suspense } from 'react';

import { Card } from '@/components/ui/card';

import { Body, Heading } from '@/app/_components/layout/page-utils';

import { NetworksChart, LoadingNetworksChart } from './_components/chart';
import { NetworksTable, LoadingNetworksTable } from './_components/networks';

import { RangeSelector } from '@/app/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { NetworksSortingProvider } from '@/app/_contexts/sorting/networks/provider';
import { defaultNetworksSorting } from '@/app/_contexts/sorting/networks/default';

import { api, HydrateClient } from '@/trpc/server';

import { getChain } from '@/app/_lib/chain';

import { ActivityTimeframe } from '@/types/timeframes';

export default async function NetworksPage({
  searchParams,
}: PageProps<'/networks'>) {
  const chain = await searchParams.then(params => getChain(params.chain));

  await Promise.all([
    api.networks.bucketedStatistics.prefetch({
      numBuckets: 48,
      timeframe: ActivityTimeframe.OneDay,
      chain,
    }),
    api.public.stats.overall.prefetch({
      timeframe: ActivityTimeframe.OneDay,
      chain,
    }),
    api.networks.list.prefetch({
      timeframe: ActivityTimeframe.OneDay,
      chain,
    }),
  ]);

  return (
    <HydrateClient>
      <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
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
