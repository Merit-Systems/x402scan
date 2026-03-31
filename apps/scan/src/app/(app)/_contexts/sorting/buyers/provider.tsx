import { SortingProvider } from '../base/provider';
import { BuyersSortingContext } from './context';

import type { BuyerSortId } from '@/services/transfers/buyers/list-mv';
import type { SortType } from '../base/types';

export const BuyersSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<BuyerSortId>;
}) => {
  return (
    <SortingProvider
      context={BuyersSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
