"use client";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { columns } from "./columns";

import { api } from "@/trpc/client";
import { useState } from "react";
import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";
import { TOOL_SORT_IDS } from "@/lib/table-sort-options";

import type { ToolSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";

export const ToolsTable = ({
  sorting,
}: {
  sorting: TableSorting<ToolSortId>;
}) => {
  const tableSorting = useUrlTableSorting({ sorting, sortIds: TOOL_SORT_IDS });

  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [topTools] = api.public.tools.top.useSuspenseQuery({
    pagination: {
      page: page,
      page_size: pageSize,
    },
    sorting,
  });

  return (
    <DataTable
      columns={columns}
      data={topTools.items}
      pageSize={pageSize}
      manualSorting={true}
      sorting={tableSorting.tableSorting}
      onSortingChange={tableSorting.onSortingChange}
      pagination={{
        pageIndex: page,
        pageSize,
        pageCount: topTools.total_pages,
      }}
      onPaginationChange={({ pageIndex }) => {
        setPage(pageIndex);
      }}
    />
  );
};

export const LoadingToolsTable = ({
  sorting,
}: {
  sorting?: TableSorting<ToolSortId>;
}) => {
  return (
    <DataTableLoading
      columns={columns}
      rowCount={10}
      manualSorting={true}
      sorting={sorting ? [sorting] : []}
    />
  );
};
