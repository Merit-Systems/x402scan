"use client";

import { useState } from "react";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";

import { TOOL_SORT_IDS } from "@/lib/table-sort-options";
import { api } from "@/trpc/client";

import { columns } from "./columns";

import type { ToolSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";

interface ToolsTableProps {
  sorting: TableSorting<ToolSortId>;
}

export const ToolsTable = ({ sorting }: ToolsTableProps) => {
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

interface LoadingToolsTableProps {
  sorting?: TableSorting<ToolSortId>;
}

export const LoadingToolsTable = ({ sorting }: LoadingToolsTableProps) => {
  return (
    <DataTableLoading
      columns={columns}
      rowCount={10}
      manualSorting={true}
      sorting={sorting ? [sorting] : []}
    />
  );
};
