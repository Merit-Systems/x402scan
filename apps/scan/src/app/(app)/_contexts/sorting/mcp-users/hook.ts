import { McpUsersSortingContext } from './context';

import { useSorting } from '../base/hook';

export const useMcpUsersSorting = () => {
  const context = useSorting(McpUsersSortingContext);
  if (!context) {
    throw new Error(
      'useMcpUsersSorting must be used within a McpUsersSortingProvider'
    );
  }
  return context;
};
