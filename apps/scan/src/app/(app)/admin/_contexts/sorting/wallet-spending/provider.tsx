import { SortingProvider } from "../base/provider";
import { WalletSpendingSortingContext } from "./context";

import type { SortType } from "../base/types";
import type { WalletSpendingSortId } from "./context";

interface WalletSpendingSortingProviderProps {
  children: React.ReactNode;
  initialSorting: SortType<WalletSpendingSortId>;
}

export const WalletSpendingSortingProvider = ({
  children,
  initialSorting,
}: WalletSpendingSortingProviderProps) => {
  return (
    <SortingProvider
      context={WalletSpendingSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
