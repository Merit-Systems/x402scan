import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { Body, Section } from '@/app/_components/layout/page-utils';

import { OverallStats } from '../(overview)/_components/stats';
// import { AgentCashAnnouncementBanner } from '../_components/v2-announcement-banner';
import { DiscoverHeading } from './_components/heading';

import { api, HydrateClient } from '@/trpc/server';

import { getChainForPage } from '@/app/(app)/_lib/chain/page';

import {
  DiscoverSellersTable,
  LoadingDiscoverSellersTable,
} from './_components/discover-origins';
import { DiscoverPageContent } from './_components/discover-page-content';

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
  const resolvedParams = await searchParams;
  const chain = await getChainForPage(resolvedParams);

  void api.public.sellers.bazaar.featured.prefetch({
    chain,
    pagination: {
      page_size: 400,
    },
    timeframe: ActivityTimeframe.ThirtyDays,
    sorting: defaultSellersSorting,
  });

  return (
    <HydrateClient>
      <SellersSortingProvider initialSorting={defaultSellersSorting}>
        <TimeRangeProvider initialTimeframe={ActivityTimeframe.ThirtyDays}>
          <div>
            <DiscoverHeading />
            <Body>
              <DiscoverPageContent>
                {/* <AgentCashAnnouncementBanner /> */}
                <OverallStats
                  chain={chain}
                  initialTimeframe={ActivityTimeframe.ThirtyDays}
                />
                <Section
                  title="Featured Services"
                  description="x402scan curated services"
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
                      <DiscoverSellersTable />
                    </Suspense>
                  </ErrorBoundary>
                </Section>
              </DiscoverPageContent>
            </Body>
          </div>
        </TimeRangeProvider>
      </SellersSortingProvider>
    </HydrateClient>
  );
}
