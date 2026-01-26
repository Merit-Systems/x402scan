import { Suspense } from 'react';

import { Card } from '@/components/ui/card';

import { Body, Heading } from '@/app/_components/layout/page-utils';

import { NetworksChart, LoadingNetworksChart } from './_components/chart';
import { NetworksTable, LoadingNetworksTable } from './_components/networks';

import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { NetworksSortingProvider } from '@/app/(app)/_contexts/sorting/networks/provider';
import { defaultNetworksSorting } from '@/app/(app)/_contexts/sorting/networks/default';

import { api, HydrateClient } from '@/trpc/server';

import { getChainForPage } from '@/app/(app)/_lib/chain/page';

import { ActivityTimeframe } from '@/types/timeframes';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Networks',
  description: 'Top networks processing x402 transactions',
};

export default async function NetworksPage({
  searchParams,
}: PageProps<'/networks'>) {
  const chain = await getChainForPage(await searchParams);

  void api.networks.bucketedStatistics.prefetch({
    numBuckets: 48,
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });
  void api.public.stats.overall.prefetch({
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });
  void api.networks.list.prefetch({
    sorting: defaultNetworksSorting,
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });

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
