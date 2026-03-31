import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { DataTable } from '@/components/ui/data-table';

import { Section } from '@/app/_components/layout/page-utils';

import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';

import { columns } from './columns';
import { BuyerSellersTable } from './table';

import { BuyerSellersSortingProvider } from './sorting-provider';

import { api, HydrateClient } from '@/trpc/server';

import { ActivityTimeframe } from '@/types/timeframes';

interface Props {
  address: string;
}

export const BuyerSellers: React.FC<Props> = ({ address }) => {
  const pageSize = 10;

  void api.public.buyers.all.sellers.prefetch({
    sender: address,
    sorting: { id: 'tx_count', desc: true },
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    timeframe: ActivityTimeframe.ThirtyDays,
  });

  return (
    <HydrateClient>
      <TimeRangeProvider initialTimeframe={ActivityTimeframe.ThirtyDays}>
        <BuyerSellersSortingProvider>
          <BuyerSellersContainer>
            <ErrorBoundary
              fallback={<p>There was an error loading the sellers data</p>}
            >
              <Suspense fallback={<LoadingBuyerSellersTable />}>
                <BuyerSellersTable address={address} />
              </Suspense>
            </ErrorBoundary>
          </BuyerSellersContainer>
        </BuyerSellersSortingProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
};

export const LoadingBuyerSellers = () => {
  return (
    <BuyerSellersContainer>
      <LoadingBuyerSellersTable />
    </BuyerSellersContainer>
  );
};

const LoadingBuyerSellersTable = () => {
  return (
    <DataTable columns={columns} data={[]} loadingRowCount={10} isLoading />
  );
};

const BuyerSellersContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Section
      title="Sellers"
      description="Servers and resources this buyer has been paying"
      actions={<RangeSelector />}
    >
      {children}
    </Section>
  );
};
