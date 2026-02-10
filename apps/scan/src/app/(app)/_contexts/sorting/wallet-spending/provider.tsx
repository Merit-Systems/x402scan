import { SortingProvider } from '../base/provider';
import { WalletSpendingSortingContext } from './context';

import type { WalletSpendingSortId } from './context';
import type { SortType } from '../base/types';

export const WalletSpendingSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<WalletSpendingSortId>;
}) => {
  return (
    <SortingProvider
      context={WalletSpendingSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
