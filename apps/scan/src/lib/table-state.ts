import { z } from "zod";

interface TableSorting<SortId extends string> {
  id: SortId;
  desc: boolean;
}

type SearchParams = Record<string, string | string[] | undefined>;

export function isSortId<SortId extends string>(
  value: string,
  sortIds: readonly SortId[]
): value is SortId {
  return sortIds.some((sortId) => sortId === value);
}

export function parseTableSorting<SortId extends string>(
  searchParams: SearchParams,
  sortIds: readonly SortId[],
  defaultSorting: TableSorting<SortId>,
  params: { sort?: string; direction?: string } = {}
): TableSorting<SortId> {
  const sortParam = params.sort ?? "s";
  const directionParam = params.direction ?? "sd";
  const id = searchParams[sortParam];
  const parsedId = z.string().safeParse(id);
  if (!parsedId.success || !isSortId(parsedId.data, sortIds)) {
    return defaultSorting;
  }

  return {
    id: parsedId.data,
    desc: searchParams[directionParam] !== "asc",
  };
}

export type { TableSorting };
