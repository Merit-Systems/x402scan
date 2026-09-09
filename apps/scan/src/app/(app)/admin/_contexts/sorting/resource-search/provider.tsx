import { SortingProvider } from "../base/provider";
import { ResourceSearchSortingContext } from "./context";

import type { SortType } from "../base/types";
import type { ResourceSearchSortId } from "./context";

interface ResourceSearchSortingProviderProps {
  children: React.ReactNode;
  initialSorting: SortType<ResourceSearchSortId>;
}

export const ResourceSearchSortingProvider = ({
  children,
  initialSorting,
}: ResourceSearchSortingProviderProps) => {
  return (
    <SortingProvider
      context={ResourceSearchSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
