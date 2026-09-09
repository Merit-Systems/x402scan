"use client";

import { useMemo, useState } from "react";

import type { SortingContext } from "./context";
import type { SortType } from "./types";

interface SortingProviderProps<SortKey extends string> {
  context: SortingContext<SortKey>;
  children: React.ReactNode;
  initialSorting: SortType<SortKey>;
}

export const SortingProvider = <SortKey extends string>({
  context,
  children,
  initialSorting,
}: SortingProviderProps<SortKey>) => {
  const [sorting, setSorting] = useState<SortType<SortKey>>(initialSorting);
  const value = useMemo(() => ({ sorting, setSorting }), [sorting]);

  return <context.Provider value={value}>{children}</context.Provider>;
};
