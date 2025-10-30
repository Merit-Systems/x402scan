import { Suspense } from 'react';

import { subDays } from 'date-fns';

import { Section } from '@/app/_components/layout/page-utils';

import { KnownSellersTable, LoadingKnownSellersTable } from './table';

import { api, HydrateClient } from '@/trpc/server';

import { defaultSellersSorting } from '../../../../../_contexts/sorting/sellers/default';
import { SellersSortingProvider } from '../../../../../_contexts/sorting/sellers/provider';

import { TimeRangeProvider } from '@/app/_contexts/time-range/provider';
import { RangeSelector } from '@/app/_contexts/time-range/component';

import { firstTransfer } from '@/services/facilitator/constants';

import { ActivityTimeframe } from '@/types/timeframes';
import { ErrorBoundary } from 'react-error-boundary';

import type { Chain } from '@/types/chain';

interface Props {
  chain?: Chain;
}

export const TopServers = async ({ chain }: Props) => {
  const endDate = new Date();
  const startDate = subDays(endDate, 1);

  await Promise.all([
    api.public.sellers.bazaar.list.prefetch({
      chain,
      pagination: {
        page_size: 100,
      },
      startDate,
      endDate,
      sorting: defaultSellersSorting,
    }),
  ]);

  return (
    <HydrateClient>
      <SellersSortingProvider initialSorting={defaultSellersSorting}>
        <TimeRangeProvider
          creationDate={firstTransfer}
          initialEndDate={endDate}
          initialStartDate={startDate}
          initialTimeframe={ActivityTimeframe.OneDay}
        >
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

const TopServersContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="Top Servers"
      description="Top addresses that have received x402 transfers and are listed in the Bazaar"
      actions={
        <div className="flex items-center gap-2">
          <RangeSelector />
        </div>
      }
    >
      {children}
    </Section>
  );
};
