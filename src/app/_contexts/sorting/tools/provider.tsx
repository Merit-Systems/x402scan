import { SortingProvider } from '../base/provider';
import { ToolsSortingContext } from './context';

import type { ToolSortId } from '@/services/db/composer/tool-call';
import type { SortType } from '../base/types';

export const ToolsSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<ToolSortId>;
}) => {
  return (
    <SortingProvider
      context={ToolsSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
