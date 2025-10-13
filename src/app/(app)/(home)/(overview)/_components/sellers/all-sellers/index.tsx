import { Suspense } from 'react';

import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { AllSellersTable } from './table';

import { api, HydrateClient } from '@/trpc/server';
import { SellersSortingProvider } from '../../../../../_contexts/sorting/sellers/provider';
import { defaultSellersSorting } from '../../../../../_contexts/sorting/sellers/default';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { firstTransfer } from '@/services/facilitator/constants';
import { Section } from '../../utils';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { subMonths } from 'date-fns';
import { ActivityTimeframe } from '@/types/timeframes';

export const AllSellers = async () => {
  const endDate = new Date();
  const startDate = subMonths(endDate, 1);

  const limit = 100;

  await api.sellers.list.all.prefetch({
    sorting: defaultSellersSorting,
    limit,
    startDate,
    endDate,
  });

  return (
    <HydrateClient>
      <TimeRangeProvider
        creationDate={firstTransfer}
        initialEndDate={endDate}
        initialStartDate={startDate}
        initialTimeframe={ActivityTimeframe.ThirtyDays}
      >
        <SellersSortingProvider initialSorting={defaultSellersSorting}>
          <AllSellersContainer>
            <Suspense fallback={<LoadingAllSellersTable />}>
              <AllSellersTable />
            </Suspense>
          </AllSellersContainer>
        </SellersSortingProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
};

export const LoadingAllSellers = () => {
  return (
    <AllSellersContainer>
      <LoadingAllSellersTable />
    </AllSellersContainer>
  );
};

const LoadingAllSellersTable = () => {
  return (
    <DataTable columns={columns} data={[]} loadingRowCount={10} isLoading />
  );
};

const AllSellersContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="All Sellers"
      description="All addresses that have received x402 transfers - known and unknown servers"
      actions={<RangeSelector />}
    >
      {children}
    </Section>
  );
};
