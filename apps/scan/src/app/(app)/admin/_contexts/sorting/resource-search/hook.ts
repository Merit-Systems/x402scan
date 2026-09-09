import { useSorting } from "../base/hook";
import { ResourceSearchSortingContext } from "./context";

export const useResourceSearchSorting = () => {
  const context = useSorting(ResourceSearchSortingContext);
  if (!context) {
    throw new Error(
      "useResourceSearchSorting must be used within a ResourceSearchSortingProvider"
    );
  }
  return context;
};
