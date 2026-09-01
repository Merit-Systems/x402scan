"use client";

import * as React from "react";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type OnChangeFn,
  type PaginationState,
  type ReactTable,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
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
  functionalUpdate,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { interactiveTableRowClassName } from "@/components/ui/interactive-row";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableLoadingCellContext {
  columnId: string;
  rowIndex: number;
}

type DataTableLoadingCell =
  | React.ReactNode
  | ((context: DataTableLoadingCellContext) => React.ReactNode);

interface DataTableColumnMeta {
  cellClassName?: string;
  headerClassName?: string;
  loadingCell?: DataTableLoadingCell;
  loadingCellClassName?: string;
}

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
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

type DataTableFeatures = typeof dataTableFeatures;
type DataTableColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;
type DataTableInstance<TData extends RowData> = ReactTable<
  DataTableFeatures,
  TData
>;

interface DataTablePaginationMeta {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalRows?: number;
}

interface DataTableProps<TData extends RowData> {
  columns: DataTableColumnDef<TData>[];
  data: TData[];
  className?: string;
  emptyMessage?: React.ReactNode;
  tableClassName?: string;
  pageSize?: number;
  getRowId?: (
    originalRow: TData,
    index: number,
    parent?: Row<DataTableFeatures, TData>
  ) => string;
  manualFiltering?: boolean;
  manualPagination?: boolean;
  manualSorting?: boolean;
  enableRowSelection?:
    | boolean
    | ((row: Row<DataTableFeatures, TData>) => boolean);
  columnFilters?: ColumnFiltersState;
  columnVisibility?: ColumnVisibilityState;
  pagination?: DataTablePaginationMeta;
  rowSelection?: RowSelectionState;
  sorting?: SortingState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  onColumnVisibilityChange?: OnChangeFn<ColumnVisibilityState>;
  onPaginationChange?: (pagination: PaginationState) => void;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  onSortingChange?: OnChangeFn<SortingState>;
  onRowClick?: (row: TData) => void;
  onRowMouseEnter?: (row: TData) => void;
  getRowHref?: (row: TData) => string;
  getRowLabel?: (row: TData) => string;
  renderPagination?: (table: DataTableInstance<TData>) => React.ReactNode;
  renderToolbar?: (table: DataTableInstance<TData>) => React.ReactNode;
}

type DataTableLoadingProps<TData extends RowData> = Pick<
  DataTableProps<TData>,
  | "columns"
  | "className"
  | "manualSorting"
  | "onSortingChange"
  | "sorting"
  | "tableClassName"
> & {
  rowCount?: number;
};

interface DataTableLoadingColumn {
  id: string;
  meta?: DataTableColumnMeta;
}

function DataTable<TData extends RowData>({
  columns,
  data,
  className,
  emptyMessage = "No results.",
  tableClassName,
  pageSize,
  getRowId,
  manualFiltering = false,
  manualPagination,
  manualSorting = false,
  enableRowSelection,
  columnFilters,
  columnVisibility,
  pagination,
  rowSelection,
  sorting,
  onColumnFiltersChange,
  onColumnVisibilityChange,
  onPaginationChange,
  onRowSelectionChange,
  onSortingChange,
  onRowClick,
  onRowMouseEnter,
  getRowHref,
  getRowLabel,
  renderPagination,
  renderToolbar,
}: DataTableProps<TData>) {
  "use no memo";

  const [localPagination, setLocalPagination] = React.useState<PaginationState>(
    {
      pageIndex: pagination?.pageIndex ?? 0,
      pageSize: pagination?.pageSize ?? pageSize ?? 10,
    }
  );
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const [localRowSelection, setLocalRowSelection] =
    React.useState<RowSelectionState>({});
  const [localColumnFilters, setLocalColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [localColumnVisibility, setLocalColumnVisibility] =
    React.useState<ColumnVisibilityState>({});

  const paginationState = pagination
    ? {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      }
    : localPagination;

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
    enableRowSelection,
    manualFiltering,
    manualPagination: manualPagination ?? Boolean(pagination),
    manualSorting,
    onColumnFiltersChange: onColumnFiltersChange ?? setLocalColumnFilters,
    onColumnVisibilityChange:
      onColumnVisibilityChange ?? setLocalColumnVisibility,
    onPaginationChange: createPaginationChangeHandler(
      paginationState,
      onPaginationChange,
      setLocalPagination
    ),
    onRowSelectionChange: onRowSelectionChange ?? setLocalRowSelection,
    onSortingChange: onSortingChange ?? setLocalSorting,
    pageCount: pagination?.pageCount,
    state: {
      columnFilters: columnFilters ?? localColumnFilters,
      columnVisibility: columnVisibility ?? localColumnVisibility,
      pagination: paginationState,
      rowSelection: rowSelection ?? localRowSelection,
      sorting: sorting ?? localSorting,
    },
  });

  return (
    <div
      className={cn(
        "flex w-full max-w-full min-w-0 flex-col gap-4",
        (getRowHref !== undefined || onRowClick !== undefined) &&
          "sm:[&>[data-slot=table-container]]:overflow-visible",
        className
      )}
    >
      {renderToolbar?.(table)}
      <Table className={cn("sm:table-fixed", tableClassName)}>
        <DataTableColGroup table={table} />
        <DataTableHeader table={table} />
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => {
              const rowHref = getRowHref?.(row.original);
              const rowLabel = getRowLabel?.(row.original) ?? "Open row";

              return (
                <TableRow
                  key={row.id}
                  aria-selected={row.getIsSelected() || undefined}
                  className={cn(
                    (rowHref !== undefined || onRowClick !== undefined) &&
                      interactiveTableRowClassName
                  )}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={(event) => {
                    if (
                      !onRowClick ||
                      shouldIgnoreRowEvent(event.target, event.currentTarget)
                    ) {
                      return;
                    }

                    onRowClick(row.original);
                  }}
                  onKeyDown={(event) => {
                    if (
                      !onRowClick ||
                      shouldIgnoreRowEvent(event.target, event.currentTarget)
                    ) {
                      return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(row.original);
                    }
                  }}
                  onMouseEnter={() => {
                    onRowMouseEnter?.(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.cellClassName}
                    >
                      {rowHref ? (
                        <a
                          href={rowHref}
                          aria-hidden={cellIndex === 0 ? undefined : true}
                          aria-label={cellIndex === 0 ? rowLabel : undefined}
                          className="absolute inset-0 z-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          tabIndex={cellIndex === 0 ? 0 : -1}
                        />
                      ) : null}
                      <div className="pointer-events-none relative z-10 [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto [&_textarea]:pointer-events-auto">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} variant="empty">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {renderPagination ? (
        renderPagination(table)
      ) : pagination ? (
        <DataTablePagination table={table} pagination={pagination} />
      ) : null}
    </div>
  );
}

function DataTableLoading<TData extends RowData>({
  columns,
  className,
  manualSorting = false,
  onSortingChange,
  rowCount = 5,
  sorting,
  tableClassName,
}: DataTableLoadingProps<TData>) {
  "use no memo";

  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const loadingColumns = getLoadingLeafColumns(columns);

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: [],
    manualSorting,
    onSortingChange: onSortingChange ?? setLocalSorting,
    state: { sorting: sorting ?? localSorting },
  });

  return (
    <div
      aria-busy="true"
      aria-label="Loading table"
      className={cn("flex w-full max-w-full min-w-0 flex-col gap-3", className)}
    >
      <Table className={cn("sm:table-fixed", tableClassName)}>
        <DataTableColGroup table={table} />
        <DataTableHeader table={table} />
        <TableBody>
          {Array.from({ length: rowCount }, (_, rowIndex) => (
            <TableRow key={rowIndex}>
              {loadingColumns.map(({ id, meta }) => (
                <TableCell
                  key={id}
                  className={cn(
                    meta?.cellClassName,
                    meta?.loadingCellClassName
                  )}
                >
                  {renderLoadingCell(meta?.loadingCell, {
                    columnId: id,
                    rowIndex,
                  })}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getLoadingLeafColumns<TData extends RowData>(
  columns: readonly DataTableColumnDef<TData>[],
  parentId?: string
): DataTableLoadingColumn[] {
  return columns.flatMap((column, index) => {
    const id = getLoadingColumnId(column, index, parentId);

    if ("columns" in column && column.columns) {
      return getLoadingLeafColumns(column.columns, id);
    }

    return [{ id, meta: column.meta }];
  });
}

function getLoadingColumnId<TData extends RowData>(
  column: DataTableColumnDef<TData>,
  index: number,
  parentId?: string
) {
  const columnId =
    column.id ??
    ("accessorKey" in column ? String(column.accessorKey) : String(index));

  return parentId ? `${parentId}.${columnId}` : columnId;
}

function DataTableColGroup<TData extends RowData>({
  table,
}: {
  table: DataTableInstance<TData>;
}) {
  const columns = table.getVisibleLeafColumns();
  const totalSize = table.getTotalSize();

  return (
    <colgroup>
      {columns.map((column) => (
        <col
          key={column.id}
          style={{ width: `${String((column.getSize() / totalSize) * 100)}%` }}
        />
      ))}
    </colgroup>
  );
}

function DataTableHeader<TData extends RowData>({
  table,
}: {
  table: DataTableInstance<TData>;
}) {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              className={header.column.columnDef.meta?.headerClassName}
              colSpan={header.colSpan}
            >
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}

type DataTableColumnHeaderProps<
  TData extends RowData,
  TValue,
> = React.ComponentProps<"div"> & {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
};

function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => {
          column.toggleSorting(sorted === "asc");
        }}
      >
        <span>{title}</span>
        {sorted === "desc" ? (
          <ArrowDownIcon data-icon="inline-end" />
        ) : sorted === "asc" ? (
          <ArrowUpIcon data-icon="inline-end" />
        ) : (
          <ChevronsUpDownIcon data-icon="inline-end" />
        )}
      </Button>
    </div>
  );
}

interface DataTablePaginationProps<TData extends RowData> {
  table: DataTableInstance<TData>;
  pagination: DataTablePaginationMeta;
}

function DataTablePagination<TData extends RowData>({
  table,
  pagination,
}: DataTablePaginationProps<TData>) {
  const firstRow =
    pagination.totalRows === 0
      ? 0
      : pagination.pageIndex * pagination.pageSize + 1;
  const lastRow =
    pagination.totalRows !== undefined
      ? Math.min(
          pagination.totalRows,
          (pagination.pageIndex + 1) * pagination.pageSize
        )
      : undefined;
  const paginationLabel =
    pagination.totalRows !== undefined
      ? `${String(firstRow)}-${String(lastRow)} of ${String(
          pagination.totalRows
        )}`
      : `Page ${String(pagination.pageIndex + 1)} of ${String(
          pagination.pageCount
        )}`;

  if (pagination.pageCount < 2) {
    return null;
  }

  return (
    <nav aria-label="Table pagination" className="flex items-center gap-4">
      <div className="type-supporting-body text-muted-foreground">
        {paginationLabel}
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            table.setPageIndex(0);
          }}
          disabled={!table.getCanPreviousPage()}
          aria-label="Go to first page"
        >
          <ChevronsLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            table.previousPage();
          }}
          disabled={!table.getCanPreviousPage()}
          aria-label="Go to previous page"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            table.nextPage();
          }}
          disabled={!table.getCanNextPage()}
          aria-label="Go to next page"
        >
          <ChevronRightIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            table.setPageIndex(pagination.pageCount - 1);
          }}
          disabled={!table.getCanNextPage()}
          aria-label="Go to last page"
        >
          <ChevronsRightIcon />
        </Button>
      </div>
    </nav>
  );
}

function shouldIgnoreRowEvent(
  target: EventTarget | null,
  row: HTMLTableRowElement
) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const interactiveTarget = target.closest(
    "a, button, input, select, textarea, summary, [role='button'], [role='link'], [data-row-click='ignore']"
  );

  return Boolean(interactiveTarget && interactiveTarget !== row);
}

function createPaginationChangeHandler(
  state: PaginationState,
  onPaginationChange: ((pagination: PaginationState) => void) | undefined,
  setLocalPagination: React.Dispatch<React.SetStateAction<PaginationState>>
): OnChangeFn<PaginationState> {
  return (updater) => {
    const nextPagination = resolveUpdater(updater, state);

    setLocalPagination(nextPagination);
    onPaginationChange?.(nextPagination);
  };
}

function resolveUpdater(
  updater: Updater<PaginationState>,
  state: PaginationState
): PaginationState {
  return functionalUpdate(updater, state);
}

function isLoadingCellRenderer(
  loadingCell: DataTableLoadingCell
): loadingCell is (context: DataTableLoadingCellContext) => React.ReactNode {
  return typeof loadingCell === "function";
}

function renderLoadingCell(
  loadingCell: DataTableLoadingCell | undefined,
  context: DataTableLoadingCellContext
) {
  if (loadingCell !== undefined && isLoadingCellRenderer(loadingCell)) {
    return loadingCell(context);
  }

  return loadingCell ?? <Skeleton className="h-4 w-full" />;
}

export {
  DataTable,
  DataTableColumnHeader,
  DataTableLoading,
  DataTablePagination,
  dataTableFeatures,
};
export type {
  DataTableColumnDef,
  DataTableColumnMeta,
  DataTableFeatures,
  DataTableInstance,
  DataTableLoadingCell,
  DataTableLoadingCellContext,
  DataTableLoadingProps,
  DataTablePaginationMeta,
  DataTableProps,
};
