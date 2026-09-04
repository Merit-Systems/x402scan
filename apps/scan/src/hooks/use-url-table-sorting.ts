"use client";

import { functionalUpdate } from "@tanstack/react-table";

import { useReplaceSearchParams } from "@/hooks/use-replace-search-params";
import { isSortId } from "@/lib/table-state";

import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { TableSorting } from "@/lib/table-state";

export function useUrlTableSorting<SortId extends string>({
  sorting,
  sortIds,
  params = {},
}: {
  sorting: TableSorting<SortId>;
  sortIds: readonly SortId[];
  params?: { sort?: string; direction?: string; page?: string };
}) {
  const replaceSearchParams = useReplaceSearchParams();
  const tableSorting: SortingState = [sorting];
  const sortParam = params.sort ?? "s";
  const directionParam = params.direction ?? "sd";
  const pageParam = params.page ?? "p";

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = functionalUpdate(updater, tableSorting)[0];

    if (!next || !isSortId(next.id, sortIds)) {
      return;
    }

    const nextSorting = {
      id: next.id,
      desc: next.id === sorting.id ? next.desc : true,
    };

    replaceSearchParams((searchParams) => {
      searchParams.set(sortParam, nextSorting.id);

      if (nextSorting.desc) {
        searchParams.delete(directionParam);
      } else {
        searchParams.set(directionParam, "asc");
      }

      searchParams.delete(pageParam);
    });
  };

  return { tableSorting, onSortingChange };
}
