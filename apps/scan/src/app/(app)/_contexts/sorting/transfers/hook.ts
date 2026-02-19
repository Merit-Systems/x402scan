import { TransfersSortingContext } from './context';

import { useSorting } from '../base/hook';

export const useTransfersSorting = () => {
  const context = useSorting(TransfersSortingContext);
  if (!context) {
    throw new Error(
      'useTransfersSorting must be used within a TransfersSortingProvider'
    );
  }
  return context;
};
