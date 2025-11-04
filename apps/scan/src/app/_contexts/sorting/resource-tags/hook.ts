import { ResourcesSortingContext } from './context';

import { useSorting } from '../base/hook';

export const useResourcesSorting = () => {
  const context = useSorting(ResourcesSortingContext);
  if (!context) {
    throw new Error(
      'useResourcesSorting must be used within a ResourcesSortingProvider'
    );
  }
  return context;
};
