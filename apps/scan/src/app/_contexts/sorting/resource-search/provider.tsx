import { SortingProvider } from '../base/provider';
import { ResourceSearchSortingContext } from './context';

import type { ResourceSearchSortId } from './context';
import type { SortType } from '../base/types';

export const ResourceSearchSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<ResourceSearchSortId>;
}) => {
  return (
    <SortingProvider
      context={ResourceSearchSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};

