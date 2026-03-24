import { BuyersSortingContext } from './context';

import { useSorting } from '../base/hook';

export const useBuyersSorting = () => {
  const context = useSorting(BuyersSortingContext);
  if (!context) {
    throw new Error(
      'useBuyersSorting must be used within a BuyersSortingProvider'
    );
  }
  return context;
};
