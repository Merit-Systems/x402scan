import { SortingProvider } from "../base/provider";
import { ResourcesSortingContext } from "./context";

import type { ResourceSortId } from "@/services/db/resources/resource";

import type { SortType } from "../base/types";

interface ResourcesSortingProviderProps {
  children: React.ReactNode;
  initialSorting: SortType<ResourceSortId>;
}

export const ResourcesSortingProvider = ({
  children,
  initialSorting,
}: ResourcesSortingProviderProps) => {
  return (
    <SortingProvider
      context={ResourcesSortingContext}
      initialSorting={initialSorting}
    >
      {children}
    </SortingProvider>
  );
};
