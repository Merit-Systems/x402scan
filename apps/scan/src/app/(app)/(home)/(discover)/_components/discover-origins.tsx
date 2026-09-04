"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useSellersSorting } from "@/app/(app)/_contexts/sorting/sellers/hook";
import { useTimeRangeContext } from "@/app/(app)/_contexts/time-range/hook";
import { useChain } from "@/app/(app)/_contexts/chain/hook";
import {
  FeaturedServiceSummary,
  TryItButton,
  featuredServiceColumns as columns,
} from "@/app/(app)/(home)/(overview)/_components/sellers/featured-columns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTokenAmount } from "@/lib/token";
import { formatCompactAgo } from "@/lib/utils";
import { api } from "@/trpc/client";

import type { FeaturedServiceItem } from "@/app/(app)/(home)/(overview)/_components/sellers/featured-columns";

const PAGE_SIZE = 15;

export const DiscoverSellersTable: React.FC = () => {
  const { sorting } = useSellersSorting();
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

  return <FeaturedServicesCollection items={topSellers.items} />;
};

export const LoadingDiscoverSellersTable = ({
  rowCount = PAGE_SIZE,
}: {
  rowCount?: number;
}) => {
  return <FeaturedServicesCollection items={[]} loadingRowCount={rowCount} />;
};

export function FeaturedServicesCollection({
  items,
  loadingRowCount,
  pageSize = PAGE_SIZE,
}: {
  items: FeaturedServiceItem[];
  loadingRowCount?: number;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const isLoading = loadingRowCount !== undefined;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleItems = items.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={items}
          pageSize={pageSize}
          loadingRowCount={loadingRowCount}
          isLoading={isLoading}
        />
      </div>
      <div className="md:hidden">
        {isLoading ? (
          <LoadingServiceList rowCount={loadingRowCount} />
        ) : visibleItems.length > 0 ? (
          <ul className="divide-y">
            {visibleItems.map((item) => {
              const origin = item.origins[0];
              if (!origin) return null;

              return (
                <li key={origin.id} className="flex flex-col gap-3 py-4">
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
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-8 text-center text-muted-foreground">No results.</p>
        )}
        {!isLoading && pageCount > 1 ? (
          <nav
            aria-label="Featured services pagination"
            className="flex items-center justify-between pt-3"
          >
            <p className="type-caption text-muted-foreground">
              {currentPage * pageSize + 1}–
              {Math.min(items.length, (currentPage + 1) * pageSize)} of{" "}
              {items.length}
            </p>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Go to previous page"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Go to next page"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </nav>
        ) : null}
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate type-caption text-muted-foreground">{label}</dt>
      <dd className="type-numeric type-supporting-body truncate">{value}</dd>
    </div>
  );
}

function LoadingServiceList({ rowCount }: { rowCount: number }) {
  return (
    <ul aria-busy="true" aria-label="Loading" className="divide-y">
      {Array.from({ length: rowCount }, (_, index) => (
        <li key={index} className="flex flex-col gap-3 py-4">
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
        </li>
      ))}
    </ul>
  );
}
