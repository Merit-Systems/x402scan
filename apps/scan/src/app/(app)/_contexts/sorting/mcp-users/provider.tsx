import { SortingProvider } from '../base/provider';
import { McpUsersSortingContext } from './context';

import type { McpUserSortId } from './types';
import type { SortType } from '../base/types';

export const McpUsersSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<McpUserSortId>;
}) => {
  return (
    <SortingProvider
      context={McpUsersSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
