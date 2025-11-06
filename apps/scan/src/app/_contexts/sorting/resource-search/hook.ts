import { ResourceSearchSortingContext } from './context';

import { useSorting } from '../base/hook';

export const useResourceSearchSorting = () => {
  const context = useSorting(ResourceSearchSortingContext);
  if (!context) {
    throw new Error(
      'useResourceSearchSorting must be used within a ResourceSearchSortingProvider'
    );
  }
  return context;
};

