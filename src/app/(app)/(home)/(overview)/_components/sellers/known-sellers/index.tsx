import { Suspense } from 'react';

import { subMonths } from 'date-fns';

import { Section } from '../../utils';

import { KnownSellersTable, LoadingKnownSellersTable } from './table';

import { api, HydrateClient } from '@/trpc/server';

import { defaultSellersSorting } from '../../../../../_contexts/sorting/sellers/default';
import { SellersSortingProvider } from '../../../../../_contexts/sorting/sellers/provider';

import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';

import { firstTransfer } from '@/services/facilitator/constants';

import { ActivityTimeframe } from '@/types/timeframes';

export const TopServers = async () => {
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);

  await Promise.all([
    api.sellers.list.bazaar.prefetch({
      startDate,
      endDate,
      sorting: defaultSellersSorting,
    }),
    api.stats.bazaar.overallStatistics.prefetch({
      startDate,
      endDate,
    }),
  ]);

  return (
    <HydrateClient>
      <SellersSortingProvider initialSorting={defaultSellersSorting}>
        <TimeRangeProvider
          creationDate={firstTransfer}
          initialEndDate={endDate}
          initialStartDate={startDate}
          initialTimeframe={ActivityTimeframe.ThirtyDays}
        >
          <TopServersContainer>
            <Suspense fallback={<LoadingKnownSellersTable />}>
              <KnownSellersTable />
            </Suspense>
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
