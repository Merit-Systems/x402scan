import type { SortType } from "../base/types";
import type { ResourceSearchSortId } from "./context";

export const defaultResourceSearchSorting: SortType<ResourceSearchSortId> = {
  id: "filterMatches",
  desc: true,
};
