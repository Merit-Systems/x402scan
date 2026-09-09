import { SortingProvider } from "../base/provider";
import { ToolSpendingSortingContext } from "./context";

import type { SortType } from "../base/types";
import type { ToolSpendingSortId } from "./context";

export const ToolSpendingSortingProvider = ({
  children,
  initialSorting,
}: {
  children: React.ReactNode;
  initialSorting: SortType<ToolSpendingSortId>;
}) => {
  return (
    <SortingProvider
      context={ToolSpendingSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
