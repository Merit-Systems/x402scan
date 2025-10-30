import { SortingProvider } from '../base/provider';
import { AgentsSortingContext } from './context';

import type { AgentSortId } from '@/services/db/agent-config/list';
import type { SortType } from '../base/types';

export const AgentsSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<AgentSortId>;
}) => {
  return (
    <SortingProvider
      context={AgentsSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
