import { SortingProvider } from '../base/provider';
import { FacilitatorsSortingContext } from './context';

import type { FacilitatorsSortId } from '@/services/transfers/facilitators/list';
import type { SortType } from '../base/types';

export const FacilitatorsSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<FacilitatorsSortId>;
}) => {
  return (
    <SortingProvider
      context={FacilitatorsSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
