import { SortingProvider } from '../base/provider';
import { TransfersSortingContext } from './context';

import type { TransfersSortId } from '@/services/cdp/sql/transfers/list';
import type { SortType } from '../base/types';

export const TransfersSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<TransfersSortId>;
}) => {
  return (
    <SortingProvider
      context={TransfersSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
