"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { useTimeRangeContext } from "@/app/(app)/_contexts/time-range/hook";
import { useChain } from "@/app/(app)/_contexts/chain/hook";
import {
  FeaturedServiceSummary,
  TryItButton,
  featuredServiceColumns as columns,
} from "@/app/(app)/(home)/(overview)/_components/sellers/featured-columns";
import {
  ResponsiveCollection,
  ResponsiveCollectionLoading,
} from "@/components/responsive-collection";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatTokenAmount } from "@/lib/token";
import { formatCompactAgo } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";
import { SELLERS_SORT_IDS } from "@/lib/table-sort-options";

import type { FeaturedServiceItem } from "@/app/(app)/(home)/(overview)/_components/sellers/featured-columns";
import type { DataListItem } from "@/components/ui/data-list";
import type { SellerSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";

const PAGE_SIZE = 15;

export const DiscoverSellersTable = ({
  sorting,
}: {
  sorting: TableSorting<SellerSortId>;
}) => {
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();

  const [topSellers] = api.public.sellers.bazaar.featured.useSuspenseQuery({
    chain,
    pagination: {
      page_size: 400,
    },
    timeframe,
    sorting,
  });

  return (
    <FeaturedServicesCollection items={topSellers.items} sorting={sorting} />
  );
};

export const LoadingDiscoverSellersTable = ({
  rowCount = PAGE_SIZE,
  sorting,
}: {
  rowCount?: number;
  sorting: TableSorting<SellerSortId>;
}) => {
  return (
    <FeaturedServicesCollection
      items={[]}
      loadingRowCount={rowCount}
      sorting={sorting}
    />
  );
};

function FeaturedServicesCollection({
  items,
  loadingRowCount,
  pageSize = PAGE_SIZE,
  sorting,
}: {
  items: FeaturedServiceItem[];
  loadingRowCount?: number;
  pageSize?: number;
  sorting: TableSorting<SellerSortId>;
}) {
  const [page, setPage] = useState(0);
  const tableSorting = useUrlTableSorting({
    sorting,
    sortIds: SELLERS_SORT_IDS,
  });
  const isLoading = loadingRowCount !== undefined;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleItems = items.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  if (isLoading) {
    return (
      <ResponsiveCollectionLoading
        rowCount={loadingRowCount}
        list={{ item: featuredServiceListItem }}
        table={{
          columns,
          manualSorting: true,
          sorting: tableSorting.tableSorting,
          onSortingChange: tableSorting.onSortingChange,
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveCollection
        data={visibleItems}
        list={{ item: featuredServiceListItem }}
        table={{
          columns,
          manualSorting: true,
          sorting: tableSorting.tableSorting,
          onSortingChange: tableSorting.onSortingChange,
          pageSize,
          pagination: {
            pageIndex: currentPage,
            pageSize,
            pageCount,
            totalRows: items.length,
          },
          onPaginationChange: ({ pageIndex }) => setPage(pageIndex),
        }}
      />
      <MobilePagination
        page={currentPage}
        pageSize={pageSize}
        total={items.length}
        totalPages={pageCount}
        onPageChange={setPage}
      />
    </div>
  );
}

function MobilePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages < 2) {
    return null;
  }

  const firstRow = page * pageSize + 1;
  const lastRow = Math.min(total, (page + 1) * pageSize);

  return (
    <nav
      aria-label="Featured services pagination"
      className="flex items-center justify-between md:hidden"
    >
      <div className="type-caption text-muted-foreground">
        {firstRow}-{lastRow} of {total}
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Go to previous page"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Go to next page"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  );
}

const featuredServiceListItem: DataListItem<FeaturedServiceItem> = {
  getItemKey: (item, index) => item.origins[0]?.id ?? index,
  renderItem: ({ item }) => {
    const origin = item.origins[0];

    if (!origin) {
      return null;
    }

    return (
      <div className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <FeaturedServiceSummary item={item} />
          <TryItButton origin={origin.origin} />
        </div>
        <dl className="grid grid-cols-4 gap-2">
          <Metric
            label="Volume"
            value={formatTokenAmount(BigInt(item.total_amount))}
          />
          <Metric
            label="Txns"
            value={item.tx_count.toLocaleString(undefined, {
              notation: "compact",
              maximumFractionDigits: 2,
            })}
          />
          <Metric
            label="Buyers"
            value={item.unique_buyers.toLocaleString(undefined, {
              notation: "compact",
              maximumFractionDigits: 2,
            })}
          />
          <Metric
            label="Latest"
            value={
              item.latest_block_timestamp
                ? formatCompactAgo(item.latest_block_timestamp)
                : "—"
            }
          />
        </dl>
      </div>
    );
  },
  renderLoadingItem: () => <LoadingServiceItem />,
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate type-caption text-muted-foreground">{label}</dt>
      <dd className="type-numeric type-supporting-body truncate">{value}</dd>
    </div>
  );
}

function LoadingServiceItem() {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-6 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-7 w-16" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, metricIndex) => (
          <div key={metricIndex} className="flex flex-col gap-1">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
