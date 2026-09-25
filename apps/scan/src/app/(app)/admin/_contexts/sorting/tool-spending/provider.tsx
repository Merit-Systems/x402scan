import { SortingProvider } from "../base/provider";
import { ToolSpendingSortingContext } from "./context";

import type { SortType } from "../base/types";
import type { ToolSpendingSortId } from "./context";

interface ToolSpendingSortingProviderProps {
  children: React.ReactNode;
  initialSorting: SortType<ToolSpendingSortId>;
}

export const ToolSpendingSortingProvider = ({
  children,
  initialSorting,
}: ToolSpendingSortingProviderProps) => {
  return (
    <SortingProvider
      context={ToolSpendingSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
