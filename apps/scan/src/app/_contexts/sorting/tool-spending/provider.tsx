import { SortingProvider } from '../base/provider';
import { ToolSpendingSortingContext } from './context';

import type { ToolSpendingSortId } from './context';
import type { SortType } from '../base/types';

export const ToolSpendingSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<ToolSpendingSortId>;
}) => {
  return (
    <SortingProvider
      context={ToolSpendingSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
