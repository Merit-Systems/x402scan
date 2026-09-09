"use client";

import { useMemo, useState } from "react";

import type { SortingContext } from "./context";
import type { SortType } from "./types";

export const SortingProvider = <SortKey extends string>({
  context,
  children,
  initialSorting,
}: {
  context: SortingContext<SortKey>;
  children: React.ReactNode;
  initialSorting: SortType<SortKey>;
}) => {
  const [sorting, setSorting] = useState<SortType<SortKey>>(initialSorting);
  const value = useMemo(() => ({ sorting, setSorting }), [sorting]);

  return <context.Provider value={value}>{children}</context.Provider>;
};
