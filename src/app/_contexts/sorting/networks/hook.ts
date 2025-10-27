import { NetworksSortingContext } from './context';

import { useSorting } from '../base/hook';

export const useNetworksSorting = () => {
  const context = useSorting(NetworksSortingContext);
  if (!context) {
    throw new Error(
      'useNetworksSorting must be used within a NetworksSortingProvider'
    );
  }
  return context;
};
