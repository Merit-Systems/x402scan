import { SortingProvider } from '../base/provider';
import { ResourcesSortingContext } from './context';

import type { ResourceSortId } from '@/services/db/resources/resource';
import type { SortType } from '../base/types';

export const ResourcesSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<ResourceSortId>;
}) => {
  return (
    <SortingProvider
      context={ResourcesSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
