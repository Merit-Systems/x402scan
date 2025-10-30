'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useRouter } from 'next/navigation';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type RowSelectionState,
  type OnChangeFn,
} from '@tanstack/react-table';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

import type { ColumnDef, Row } from '@tanstack/react-table';
import type { Route } from 'next';

export type ExtendedColumnDef<TData, TValue = unknown> = ColumnDef<
  TData,
  TValue
> & {
  loading?: React.ComponentType;
};

interface DataTableProps<TData, TValue, AppRoute extends string> {
  columns: ExtendedColumnDef<TData, TValue>[];
  data: TData[];
  href?: (data: TData) => Route<AppRoute>;
  onRowClick?: (row: Row<TData>) => void;
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

export function DataTable<TData, TValue, AppRoute extends string>({
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
}: DataTableProps<TData, TValue, AppRoute>) {
  const isServerSidePagination =
    page !== undefined && onPageChange !== undefined;

  const table = useReactTable({
    data: isLoading ? (Array(loadingRowCount).fill(null) as TData[]) : data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerSidePagination
      ? undefined
      : getPaginationRowModel(),
    initialState: {
      pagination: {
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
      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
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
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={
                    href
                      ? () => {
                          router.push(href(row.original));
                        }
                      : onRowClick
                        ? () => onRowClick(row)
                        : undefined
                  }
                  className={cn((href ?? onRowClick) && 'cursor-pointer')}
                >
                  {row.getVisibleCells().map(cell => (
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
          className="size-fit md:size-fit p-1"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {isLoading ? (
          <Skeleton className="h-4 w-20" />
        ) : (
          <p className="text-xs text-muted-foreground">
            {isServerSidePagination
              ? `Page ${page + 1}${totalPages ? ` of ${totalPages.toLocaleString()}` : ''}`
              : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
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
          className="size-fit md:size-fit p-1"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
