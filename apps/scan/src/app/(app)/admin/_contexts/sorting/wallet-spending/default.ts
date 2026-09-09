import type { SortType } from "../base/types";
import type { WalletSpendingSortId } from "./context";

export const defaultWalletSpendingSorting: SortType<WalletSpendingSortId> = {
  id: "totalMaxAmount",
  desc: true,
};
