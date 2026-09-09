import { SortingProvider } from "../base/provider";
import { WalletSpendingSortingContext } from "./context";

import type { SortType } from "../base/types";
import type { WalletSpendingSortId } from "./context";

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
