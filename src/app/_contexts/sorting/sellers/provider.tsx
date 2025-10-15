import { SortingProvider } from '../base/provider';
import { SellersSortingContext } from './context';

import type { SellerSortId } from '@/services/indexer/sellers/list';
import type { SortType } from '../base/types';

export const SellersSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<SellerSortId>;
}) => {
  return (
    <SortingProvider
      context={SellersSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
