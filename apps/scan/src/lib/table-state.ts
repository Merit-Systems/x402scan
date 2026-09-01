import { sortingSchema } from "@/lib/schemas";

interface TableSorting<SortId extends string> {
  id: SortId;
  desc: boolean;
}

type SearchParams = Record<string, string | string[] | undefined>;

export function parseTableSorting<SortId extends string>(
  searchParams: SearchParams,
  sortIds: readonly SortId[],
  defaultSorting: TableSorting<SortId>,
  params: { sort?: string; direction?: string } = {}
): TableSorting<SortId> {
  const sortParam = params.sort ?? "s";
  const directionParam = params.direction ?? "sd";
  const parsed = sortingSchema(sortIds).safeParse({
    id: searchParams[sortParam],
    desc: searchParams[directionParam] !== "asc",
  });

  if (!parsed.success) {
    return defaultSorting;
  }

  return {
    id: parsed.data.id as SortId,
    desc: parsed.data.desc,
  };
}

export type { TableSorting };
