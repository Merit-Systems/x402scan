import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";

import {
  DataList,
  DataListLoading,
  type DataListLoadingProps,
  type DataListProps,
} from "@/components/ui/data-list";
import {
  DataTable,
  DataTableLoading,
  type DataTableLoadingProps,
  type DataTableProps,
} from "@/components/ui/data-table";
import { ResponsiveView } from "@/components/ui/responsive-view";

interface ResponsiveCollectionProps<TData extends RowData> {
  data: TData[];
  emptyMessage?: ReactNode;
  list: Omit<DataListProps<TData>, "data" | "emptyMessage">;
  table: Omit<DataTableProps<TData>, "data" | "emptyMessage">;
}

interface ResponsiveCollectionLoadingProps<TData extends RowData> {
  list: Omit<DataListLoadingProps<TData>, "rowCount">;
  rowCount?: number;
  table: Omit<DataTableLoadingProps<TData>, "rowCount">;
}

export function ResponsiveCollection<TData extends RowData>({
  data,
  emptyMessage,
  list,
  table,
}: ResponsiveCollectionProps<TData>) {
  return (
    <ResponsiveView
      desktop={<DataTable {...table} data={data} emptyMessage={emptyMessage} />}
      mobile={<DataList {...list} data={data} emptyMessage={emptyMessage} />}
    />
  );
}

export function ResponsiveCollectionLoading<TData extends RowData>({
  list,
  rowCount,
  table,
}: ResponsiveCollectionLoadingProps<TData>) {
  return (
    <ResponsiveView
      desktop={<DataTableLoading {...table} rowCount={rowCount} />}
      mobile={<DataListLoading {...list} rowCount={rowCount} />}
    />
  );
}

export type { ResponsiveCollectionLoadingProps, ResponsiveCollectionProps };
