"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface DataListItemContext<TData> {
  item: TData;
  index: number;
}

interface DataListLoadingItemContext {
  index: number;
}

interface DataListItem<TData> {
  getItemKey: (item: TData, index: number) => React.Key;
  renderItem: (context: DataListItemContext<TData>) => React.ReactNode;
  renderLoadingItem?: (context: DataListLoadingItemContext) => React.ReactNode;
}

interface DataListProps<TData> {
  data: TData[];
  item: DataListItem<TData>;
  className?: string;
  itemClassName?: string;
  emptyMessage?: React.ReactNode;
}

interface DataListLoadingProps<TData> {
  item: DataListItem<TData>;
  className?: string;
  itemClassName?: string;
  rowCount?: number;
}

type InfiniteDataListProps<TData> = DataListProps<TData> & {
  fetchMode?: "button" | "auto";
  hasNextPage: boolean;
  isFetchingNextPage?: boolean;
  loadMoreLabel?: React.ReactNode;
  loadingMoreLabel?: React.ReactNode;
  onLoadMore: () => void;
};

function DataList<TData>({
  data,
  item,
  className,
  itemClassName,
  emptyMessage = "No results.",
}: DataListProps<TData>) {
  if (!data.length) {
    return (
      <div className={cn("py-8 text-center text-muted-foreground", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className={cn("flex list-none flex-col divide-y p-0", className)}>
      {data.map((dataItem, index) => (
        <li key={item.getItemKey(dataItem, index)} className={itemClassName}>
          {item.renderItem({ item: dataItem, index })}
        </li>
      ))}
    </ul>
  );
}

function DataListLoading<TData>({
  item,
  className,
  itemClassName,
  rowCount = 5,
}: DataListLoadingProps<TData>) {
  return (
    <ul
      aria-busy="true"
      aria-label="Loading"
      className={cn("flex list-none flex-col divide-y p-0", className)}
    >
      {Array.from({ length: rowCount }, (_, index) => (
        <li key={index} className={itemClassName}>
          {item.renderLoadingItem?.({ index })}
        </li>
      ))}
    </ul>
  );
}

function InfiniteDataList<TData>({
  className,
  fetchMode = "button",
  hasNextPage,
  isFetchingNextPage = false,
  loadMoreLabel = "Load more",
  loadingMoreLabel = "Loading...",
  onLoadMore,
  ...dataListProps
}: InfiniteDataListProps<TData>) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (fetchMode !== "auto" || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "160px" }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [fetchMode, hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <div className={cn("flex flex-col", className)}>
      <DataList {...dataListProps} />
      {fetchMode === "auto" ? (
        <div
          ref={sentinelRef}
          aria-live="polite"
          className="flex min-h-8 items-center justify-center pt-3"
        >
          {isFetchingNextPage ? (
            <>
              <Spinner className="size-4" />
              <span className="sr-only">{loadingMoreLabel}</span>
            </>
          ) : null}
        </div>
      ) : hasNextPage ? (
        <div className="flex justify-center pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
          >
            {isFetchingNextPage ? loadingMoreLabel : loadMoreLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export { DataList, DataListLoading, InfiniteDataList };
export type {
  DataListItem,
  DataListItemContext,
  DataListLoadingItemContext,
  DataListLoadingProps,
  DataListProps,
  InfiniteDataListProps,
};
