"use client";

import { useState } from "react";
import type { RowData } from "@tanstack/react-table";

import {
  DataTable,
  DataTableLoading,
  type DataTableProps,
} from "@/components/ui/data-table";

type LoadableDataTableProps<TData extends RowData> = DataTableProps<TData> & {
  isLoading: boolean;
  loadingRowCount?: number;
};

export function LoadableDataTable<TData extends RowData>({
  isLoading,
  loadingRowCount,
  ...props
}: LoadableDataTableProps<TData>) {
  const [localPageIndex, setLocalPageIndex] = useState(0);

  if (isLoading) {
    return (
      <DataTableLoading
        columns={props.columns}
        className={props.className}
        manualSorting={props.manualSorting}
        onSortingChange={props.onSortingChange}
        rowCount={loadingRowCount}
        sorting={props.sorting}
        tableClassName={props.tableClassName}
      />
    );
  }

  if (props.pagination) {
    return <DataTable {...props} />;
  }

  const pageSize = props.pageSize ?? 10;
  const pageCount = Math.max(1, Math.ceil(props.data.length / pageSize));
  const pageIndex = Math.min(localPageIndex, pageCount - 1);
  const data = props.data.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  return (
    <DataTable
      {...props}
      data={data}
      pagination={{
        pageIndex,
        pageSize,
        pageCount,
        totalRows: props.data.length,
      }}
      onPaginationChange={(pagination) => {
        setLocalPageIndex(pagination.pageIndex);
        props.onPaginationChange?.(pagination);
      }}
    />
  );
}
