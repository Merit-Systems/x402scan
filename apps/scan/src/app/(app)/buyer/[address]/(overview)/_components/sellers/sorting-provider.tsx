'use client';

import { createSortingContext } from '@/app/(app)/_contexts/sorting/base/context';
import { SortingProvider } from '@/app/(app)/_contexts/sorting/base/provider';
import { useSorting } from '@/app/(app)/_contexts/sorting/base/hook';

import type { BuyerSellerSortId } from '@/services/transfers/buyers/sellers/list';

export const BuyerSellersSortingContext =
  createSortingContext<BuyerSellerSortId>();

export const BuyerSellersSortingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <SortingProvider
      context={BuyerSellersSortingContext}
      initialSorting={{ id: 'tx_count', desc: true }}
    >
      {children}
    </SortingProvider>
  );
};

export const useBuyerSellersSorting = () => {
  const context = useSorting(BuyerSellersSortingContext);
  if (!context) {
    throw new Error(
      'useBuyerSellersSorting must be used within a BuyerSellersSortingProvider'
    );
  }
  return context;
};
