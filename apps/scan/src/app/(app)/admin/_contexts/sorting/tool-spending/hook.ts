import { useSorting } from "../base/hook";
import { ToolSpendingSortingContext } from "./context";

export const useToolSpendingSorting = () => {
  const context = useSorting(ToolSpendingSortingContext);
  if (!context) {
    throw new Error(
      "useToolSpendingSorting must be used within a ToolSpendingSortingProvider"
    );
  }
  return context;
};
