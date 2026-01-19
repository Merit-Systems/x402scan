import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { KnownSellersTable, LoadingKnownSellersTable } from './table';
import { TopServersContainer } from './container';

import { api, HydrateClient } from '@/trpc/server';

import { defaultSellersSorting } from '@/app/_contexts/sorting/sellers/default';
import { SellersSortingProvider } from '@/app/_contexts/sorting/sellers/provider';

import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';

import { ActivityTimeframe } from '@/types/timeframes';

import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const TopServers: React.FC<Props> = ({ chain }) => {
  void api.public.sellers.bazaar.list.prefetch({
    chain,
    pagination: {
      page_size: 100,
    },
    timeframe: ActivityTimeframe.OneDay,
    sorting: defaultSellersSorting,
  });

  return (
    <HydrateClient>
      <SellersSortingProvider initialSorting={defaultSellersSorting}>
        <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
          <TopServersContainer>
            <ErrorBoundary
              fallback={
                <p>There was an error loading the known sellers data</p>
              }
            >
              <Suspense fallback={<LoadingKnownSellersTable />}>
                <KnownSellersTable />
              </Suspense>
            </ErrorBoundary>
          </TopServersContainer>
        </TimeRangeProvider>
      </SellersSortingProvider>
    </HydrateClient>
  );
};

export const LoadingTopServers = () => {
  return (
    <TopServersContainer>
      <LoadingKnownSellersTable />
    </TopServersContainer>
  );
};
