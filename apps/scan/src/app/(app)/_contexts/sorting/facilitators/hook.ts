import { FacilitatorsSortingContext } from './context';

import { useSorting } from '../base/hook';

export const useFacilitatorsSorting = () => {
  const context = useSorting(FacilitatorsSortingContext);
  if (!context) {
    throw new Error(
      'useFacilitatorsSorting must be used within a FacilitatorsSortingProvider'
    );
  }
  return context;
};
