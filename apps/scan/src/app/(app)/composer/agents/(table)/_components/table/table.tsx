"use client";

import { useState } from "react";

import { DataTable, DataTableLoading } from "@/components/ui/data-table";

import { columns } from "./columns";

import { api } from "@/trpc/client";

import type { RouterInputs } from "@/trpc/client";
import { useTimeRangeContext } from "@/app/(app)/_contexts/time-range/hook";
import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";
import { AGENTS_SORT_IDS } from "@/lib/table-sort-options";

import type { AgentSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";

interface Props {
  input: Omit<
    RouterInputs["public"]["agents"]["list"],
    "sorting" | "pagination"
  >;
  limit?: number;
  sorting: TableSorting<AgentSortId>;
}

export const AgentsTable: React.FC<Props> = ({
  input,
  limit = 10,
  sorting,
}) => {
  const { timeframe } = useTimeRangeContext();
  const tableSorting = useUrlTableSorting({
    sorting,
    sortIds: AGENTS_SORT_IDS,
  });

  const [page, setPage] = useState(0);
  const [agents] = api.public.agents.list.useSuspenseQuery({
    ...input,
    sorting,
    pagination: {
      page,
      page_size: limit,
    },
    timeframe,
  });

  return (
    <DataTable
      columns={columns}
      data={agents.items}
      getRowHref={({ id }) => `/composer/agent/${id}`}
      getRowLabel={({ name }) => `Open ${name}`}
      pageSize={10}
      manualSorting={true}
      sorting={tableSorting.tableSorting}
      onSortingChange={tableSorting.onSortingChange}
      pagination={{
        pageIndex: page,
        pageSize: limit,
        pageCount: agents.total_pages,
      }}
      onPaginationChange={({ pageIndex }) => {
        setPage(pageIndex);
      }}
    />
  );
};

export const LoadingAgentsTable = ({
  limit = 10,
  sorting,
}: {
  limit?: number;
  sorting?: TableSorting<AgentSortId>;
}) => {
  return (
    <DataTableLoading
      columns={columns}
      rowCount={limit}
      manualSorting={true}
      sorting={sorting ? [sorting] : []}
    />
  );
};
