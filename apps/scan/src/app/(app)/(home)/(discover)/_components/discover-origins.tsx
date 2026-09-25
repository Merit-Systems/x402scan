"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ResponsiveCollection,
  ResponsiveCollectionLoading,
} from "@/components/responsive-collection";
import {
  LoadingServiceSummary,
  ServiceSummary,
} from "@/components/service-summary";
import { Button } from "@/components/ui/button";

import { useReplaceSearchParams } from "@/hooks/use-replace-search-params";
import { useUrlTableSorting } from "@/hooks/use-url-table-sorting";

import {
  LoadingServiceMetric,
  ServiceBuyersMetric,
  ServiceLatestMetric,
  ServiceMetricsGrid,
  ServiceTransactionsMetric,
  ServiceVolumeMetric,
} from "@/app/(app)/_components/service-collection";
import { formatDiscoverPage, SERVICES_PAGE_SIZE } from "@/lib/discover/filters";
import { SELLERS_SORT_IDS } from "@/lib/table-sort-options";
import { api } from "@/trpc/client";

import { serviceColumns as columns } from "./service-columns";

import type { Route } from "next";

import type { DataListItem } from "@/components/ui/data-list";

import type { ServiceView } from "@/lib/discover/filters";
import type { SellerSortId } from "@/lib/table-sort-options";
import type { TableSorting } from "@/lib/table-state";
import type { Chain } from "@/types/chain";
import type { ActivityTimeframe } from "@/types/timeframes";

import type { ServiceItem } from "./service-columns";

const PAGE_SIZE = SERVICES_PAGE_SIZE;

interface DiscoverServicesProps {
  chain?: Chain;
  sorting: TableSorting<SellerSortId>;
  timeframe: ActivityTimeframe;
  view: ServiceView;
  page: number;
}

export const DiscoverServices = ({
  chain,
  sorting,
  timeframe,
  view,
  page,
}: DiscoverServicesProps) => {
  return view === "featured" ? (
    <FeaturedServices
      chain={chain}
      page={page}
      sorting={sorting}
      timeframe={timeframe}
    />
  ) : (
    <AllServices
      chain={chain}
      page={page}
      sorting={sorting}
      timeframe={timeframe}
    />
  );
};

interface FeaturedServicesProps {
  chain?: Chain;
  page: number;
  sorting: TableSorting<SellerSortId>;
  timeframe: ActivityTimeframe;
}

const FeaturedServices = ({
  chain,
  page,
  sorting,
  timeframe,
}: FeaturedServicesProps) => {
  const [topSellers] = api.public.sellers.bazaar.featured.useSuspenseQuery({
    chain,
    pagination: {
      page,
      page_size: PAGE_SIZE,
    },
    timeframe,
    sorting,
  });

  return (
    <ServicesCollection page={page} result={topSellers} sorting={sorting} />
  );
};

interface AllServicesProps {
  chain?: Chain;
  page: number;
  sorting: TableSorting<SellerSortId>;
  timeframe: ActivityTimeframe;
}

const AllServices = ({ chain, page, sorting, timeframe }: AllServicesProps) => {
  const [topSellers] = api.public.sellers.bazaar.list.useSuspenseQuery({
    chain,
    pagination: {
      page,
      page_size: PAGE_SIZE,
    },
    timeframe,
    sorting,
  });

  return (
    <ServicesCollection page={page} result={topSellers} sorting={sorting} />
  );
};

interface LoadingDiscoverServicesProps {
  rowCount?: number;
  sorting: TableSorting<SellerSortId>;
}

export const LoadingDiscoverServices = ({
  rowCount = PAGE_SIZE,
  sorting,
}: LoadingDiscoverServicesProps) => {
  return (
    <ResponsiveCollectionLoading
      rowCount={rowCount}
      list={{ item: serviceListItem }}
      table={{
        columns,
        manualSorting: true,
        sorting: [sorting],
      }}
    />
  );
};

interface ServicesCollectionProps {
  page: number;
  result: {
    items: ServiceItem[];
    total_count: number;
    total_pages: number;
  };
  sorting: TableSorting<SellerSortId>;
}

function ServicesCollection({
  page,
  result,
  sorting,
}: ServicesCollectionProps) {
  const router = useRouter();
  const replaceSearchParams = useReplaceSearchParams();
  const tableSorting = useUrlTableSorting({
    sorting,
    sortIds: SELLERS_SORT_IDS,
  });
  const totalPages = Math.max(1, result.total_pages);
  const setPage = (nextPage: number) => {
    replaceSearchParams((params) => {
      const pageParam = formatDiscoverPage(nextPage);
      if (pageParam) {
        params.set("p", pageParam);
      } else {
        params.delete("p");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveCollection
        data={result.items}
        list={{ item: serviceListItem }}
        table={{
          columns,
          getRowHref: getServiceHref,
          getRowLabel: (item) => `Open ${getServiceName(item)}`,
          manualSorting: true,
          onRowMouseEnter: (item) => {
            router.prefetch(getServiceHref(item));
          },
          sorting: tableSorting.tableSorting,
          onSortingChange: tableSorting.onSortingChange,
          pageSize: PAGE_SIZE,
          pagination: {
            pageIndex: page,
            pageSize: PAGE_SIZE,
            pageCount: totalPages,
            totalRows: result.total_count,
          },
          onPaginationChange: ({ pageIndex }) => {
            setPage(pageIndex);
          },
        }}
      />
      <MobilePagination
        page={page}
        pageSize={PAGE_SIZE}
        total={result.total_count}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

interface MobilePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function MobilePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: MobilePaginationProps) {
  if (totalPages < 2) {
    return null;
  }

  const firstRow = page * pageSize + 1;
  const lastRow = Math.min(total, (page + 1) * pageSize);

  return (
    <nav
      aria-label="Services pagination"
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
          onClick={() => {
            onPageChange(page - 1);
          }}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Go to next page"
          disabled={page >= totalPages - 1}
          onClick={() => {
            onPageChange(page + 1);
          }}
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  );
}

const serviceListItem: DataListItem<ServiceItem> = {
  getItemKey: (item, index) => item.origins[0]?.id ?? index,
  renderItem: ({ item }) => {
    const origin = item.origins[0];

    if (!origin) {
      return null;
    }

    return (
      <Link href={getServiceHref(item)} className="flex flex-col gap-2 py-4">
        <ServiceSummary
          item={item}
          descriptionPlacement="below"
          nameVariant="card-title"
        />
        <ServiceMetricsGrid>
          <ServiceVolumeMetric item={item} />
          <ServiceTransactionsMetric item={item} />
          <ServiceBuyersMetric item={item} />
          <ServiceLatestMetric item={item} />
        </ServiceMetricsGrid>
      </Link>
    );
  },
  renderLoadingItem: () => <LoadingServiceItem />,
};

function LoadingServiceItem() {
  return (
    <div className="flex flex-col gap-3 py-4">
      <LoadingServiceSummary />
      <ServiceMetricsGrid>
        {Array.from({ length: 4 }, (_, metricIndex) => (
          <LoadingServiceMetric key={metricIndex} />
        ))}
      </ServiceMetricsGrid>
    </div>
  );
}

function getServiceHref(item: ServiceItem): Route {
  const origin = item.origins[0];

  if (!origin) {
    throw new Error("A service row must have at least one origin");
  }

  // Next's generated Route union cannot model an identifier interpolated at runtime.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return `/server/${origin.id}` as Route;
}

function getServiceName(item: ServiceItem) {
  const origin = item.origins[0];

  if (!origin) {
    return "server";
  }

  const title = origin.title?.trim();
  if (title) {
    return title;
  }

  return new URL(origin.origin).hostname;
}
