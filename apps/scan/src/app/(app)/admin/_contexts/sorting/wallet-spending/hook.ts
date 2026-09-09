import { useSorting } from "../base/hook";
import { WalletSpendingSortingContext } from "./context";

export const useWalletSpendingSorting = () => {
  const context = useSorting(WalletSpendingSortingContext);
  if (!context) {
    throw new Error(
      "useWalletSpendingSorting must be used within a WalletSpendingSortingProvider"
    );
  }
  return context;
};
