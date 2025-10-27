import { SortingProvider } from '../base/provider';
import { NetworksSortingContext } from './context';

import type { NetworksSortId } from '@/services/transfers/networks/list';
import type { SortType } from '../base/types';

export const NetworksSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<NetworksSortId>;
}) => {
  return (
    <SortingProvider
      context={NetworksSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
