import { DataList, DataListLoading } from "@/components/ui/data-list";
import { DataTable, DataTableLoading } from "@/components/ui/data-table";
import { ResponsiveView } from "@/components/ui/responsive-view";

import type { ReactNode } from "react";

import type { RowData } from "@tanstack/react-table";

import type {
  DataListLoadingProps,
  DataListProps,
} from "@/components/ui/data-list";
import type {
  DataTableLoadingProps,
  DataTableProps,
} from "@/components/ui/data-table";

interface ResponsiveCollectionProps<
  TData extends RowData,
  Href extends string = string,
> {
  data: TData[];
  emptyMessage?: ReactNode;
  list: Omit<DataListProps<TData>, "data" | "emptyMessage">;
  table: Omit<DataTableProps<TData, Href>, "data" | "emptyMessage">;
}

interface ResponsiveCollectionLoadingProps<TData extends RowData> {
  list: Omit<DataListLoadingProps<TData>, "rowCount">;
  rowCount?: number;
  table: Omit<DataTableLoadingProps<TData>, "rowCount">;
}

export function ResponsiveCollection<
  TData extends RowData,
  const Href extends string = string,
>({ data, emptyMessage, list, table }: ResponsiveCollectionProps<TData, Href>) {
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
