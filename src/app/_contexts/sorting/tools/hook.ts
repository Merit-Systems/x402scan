import { ToolsSortingContext } from './context';

import { useSorting } from '../base/hook';

export const useToolsSorting = () => {
  const context = useSorting(ToolsSortingContext);
  if (!context) {
    throw new Error(
      'useToolsSorting must be used within a ToolsSortingProvider'
    );
  }
  return context;
};
