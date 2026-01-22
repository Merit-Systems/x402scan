import { AgentsSortingContext } from './context';

import { useSorting } from '../base/hook';

export const useAgentsSorting = () => {
  const context = useSorting(AgentsSortingContext);
  if (!context) {
    throw new Error(
      'useAgentsSorting must be used within a AgentsSortingProvider'
    );
  }
  return context;
};
