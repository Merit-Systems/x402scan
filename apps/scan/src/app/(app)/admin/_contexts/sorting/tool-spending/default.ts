import type { SortType } from "../base/types";
import type { ToolSpendingSortId } from "./context";

export const defaultToolSpendingSorting: SortType<ToolSpendingSortId> = {
  id: "totalMaxAmount",
  desc: true,
};
