import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { Body, Section } from '@/app/_components/layout/page-utils';

import { HomeHeading } from '../(overview)/_components/heading';
import { OverallStats } from '../(overview)/_components/stats';

import { api, HydrateClient } from '@/trpc/server';

import { getDiscoverOrigins } from '@/lib/discover/origins';
import { getChainForPage } from '@/app/(app)/_lib/chain/page';

import {
  DiscoverSellersTable,
  LoadingDiscoverSellersTable,
} from './_components/discover-origins';

import { defaultSellersSorting } from '@/app/(app)/_contexts/sorting/sellers/default';
import { SellersSortingProvider } from '@/app/(app)/_contexts/sorting/sellers/provider';

import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';

import { ActivityTimeframe } from '@/types/timeframes';

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const chain = await getChainForPage(await searchParams);
  const originUrls = await getDiscoverOrigins();

  void api.public.sellers.bazaar.list.prefetch({
    pagination: {
      page_size: 100,
    },
    timeframe: ActivityTimeframe.OneDay,
    sorting: defaultSellersSorting,
    originUrls,
  });

  return (
    <div>
      <HomeHeading />
      <Body>
        <OverallStats chain={chain} />
        <HydrateClient>
          <SellersSortingProvider initialSorting={defaultSellersSorting}>
            <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
              <Section
                title="Top Sellers"
                description="x402Scan curated x402-enabled services."
                actions={
                  <div className="flex items-center gap-2">
                    <RangeSelector />
                  </div>
                }
              >
                <ErrorBoundary
                  fallback={
                    <p>There was an error loading the discover data</p>
                  }
                >
                  <Suspense fallback={<LoadingDiscoverSellersTable />}>
                    <DiscoverSellersTable originUrls={originUrls} />
                  </Suspense>
                </ErrorBoundary>
              </Section>
            </TimeRangeProvider>
          </SellersSortingProvider>
        </HydrateClient>
      </Body>
    </div>
  );
}
