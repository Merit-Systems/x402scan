"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { useRouter } from "next/navigation";

import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_equals,
  filterFn_inDateRange,
  filterFn_inNumberRange,
  filterFn_includesString,
  filterFn_weakEquals,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowSelectionState,
  type OnChangeFn,
  type Row,
  type RowData,
} from "@tanstack/react-table";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import type { Route } from "next";

const dataTableFeatures = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    arrIncludes: filterFn_arrIncludes,
    equals: filterFn_equals,
    inDateRange: filterFn_inDateRange,
    inNumberRange: filterFn_inNumberRange,
    includesString: filterFn_includesString,
    weakEquals: filterFn_weakEquals,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
});

type DataTableFeatures = typeof dataTableFeatures;

export type ExtendedColumnDef<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData,
  unknown
> & {
  loading?: React.ComponentType;
};

export type DataTableRow<TData extends RowData> = Row<DataTableFeatures, TData>;

interface DataTableProps<TData extends RowData, AppRoute extends string> {
  columns: ExtendedColumnDef<TData>[];
  data: TData[];
  href?: (data: TData) => Route<AppRoute>;
  onRowClick?: (row: DataTableRow<TData>) => void;
  isLoading?: boolean;
  loadingRowCount?: number;
  pageSize?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  totalPages?: number;
  hasNextPage?: boolean;
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: TData, index: number) => string;
}

export function DataTable<TData extends RowData, AppRoute extends string>({
  columns,
  data,
  href,
  onRowClick,
  isLoading = false,
  loadingRowCount = 5,
  pageSize = 10,
  page,
  onPageChange,
  hasNextPage,
  totalPages,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  getRowId,
}: DataTableProps<TData, AppRoute>) {
  const isServerSidePagination =
    page !== undefined && onPageChange !== undefined;

  const table = useTable({
    features: dataTableFeatures,
    data: isLoading ? (Array(loadingRowCount).fill(null) as TData[]) : data,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    manualPagination: isServerSidePagination,
    pageCount: isServerSidePagination ? -1 : undefined,
    enableRowSelection,
    state: {
      rowSelection: rowSelection ?? {},
    },
    onRowSelectionChange: onRowSelectionChange,
    getRowId: getRowId,
  });

  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      <Card className="overflow-hidden bg-card dark:bg-muted/80">
        <Table>
          <TableHeader className="bg-muted dark:bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="font-bold"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Render loading skeleton rows
              Array.from({ length: loadingRowCount }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {columns.map((column, columnIndex) => (
                    <TableCell
                      key={`loading-${index}-${columnIndex}`}
                      style={{ width: column.size }}
                    >
                      {column.loading ? (
                        <column.loading />
                      ) : (
                        <Skeleton className="h-4 w-full" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={
                    href
                      ? () => {
                          router.push(href(row.original));
                        }
                      : onRowClick
                        ? () => onRowClick(row)
                        : undefined
                  }
                  className={cn((href ?? onRowClick) && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isServerSidePagination && onPageChange) {
              onPageChange(page - 1);
            } else {
              table.previousPage();
            }
          }}
          disabled={
            isServerSidePagination ? page === 0 : !table.getCanPreviousPage()
          }
          className="size-fit p-1 md:size-fit"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <p className="text-xs text-muted-foreground">
            {isServerSidePagination
              ? `Page ${page + 1}${totalPages ? ` of ${totalPages.toLocaleString()}` : ""}`
              : `Page ${table.state.pagination.pageIndex + 1} of ${table.getPageCount()}`}
          </p>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isServerSidePagination && onPageChange) {
              onPageChange(page + 1);
            } else {
              table.nextPage();
            }
          }}
          disabled={
            isServerSidePagination
              ? hasNextPage === false
              : !table.getCanNextPage()
          }
          className="size-fit p-1 md:size-fit"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
