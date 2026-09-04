import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { OverallStatsContent } from "./_components/stats";
import { DiscoverHeading } from "./_components/heading";
import { ServiceViewToggle } from "./_components/service-view-toggle";
import { TimeframeSelect } from "@/components/timeframe-select";

import { api, HydrateClient } from "@/trpc/server";

import { getChainForPage } from "@/app/(app)/_lib/chain/page";

import {
  DiscoverServices,
  LoadingDiscoverServices,
} from "./_components/discover-origins";
import { UsageSection } from "@/components/usage-section";
import { Separator } from "@/components/ui/separator";
import {
  parseDiscoverPage,
  parseServiceView,
  SERVICES_PAGE_SIZE,
} from "@/lib/discover/filters";
import { parseTableSorting } from "@/lib/table-state";
import {
  DEFAULT_SELLERS_SORTING,
  SELLERS_SORT_IDS,
} from "@/lib/table-sort-options";
import { parseUsageTimeframe } from "@/lib/timeframe";

export default async function DiscoverPage({ searchParams }: PageProps<"/">) {
  const resolvedParams = await searchParams;
  const chain = await getChainForPage(resolvedParams);
  const sorting = parseTableSorting(
    resolvedParams,
    SELLERS_SORT_IDS,
    DEFAULT_SELLERS_SORTING
  );
  const timeframe = parseUsageTimeframe(resolvedParams.d);
  const view = parseServiceView(resolvedParams.v);
  const page = parseDiscoverPage(resolvedParams.p);

  const sellersInputBase = {
    chain,
    timeframe,
    sorting,
  };

  if (view === "featured") {
    void api.public.sellers.bazaar.featured.prefetch({
      ...sellersInputBase,
      pagination: { page, page_size: SERVICES_PAGE_SIZE },
    });
  } else {
    void api.public.sellers.bazaar.list.prefetch({
      ...sellersInputBase,
      pagination: { page, page_size: SERVICES_PAGE_SIZE },
    });
  }

  return (
    <HydrateClient>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
        <DiscoverHeading />
        <UsageSection
          controls={
            <div className="flex flex-wrap items-center gap-0 sm:gap-2">
              <ServiceViewToggle view={view} />
              <Separator orientation="vertical" className="hidden sm:block" />
              <TimeframeSelect timeframe={timeframe} />
            </div>
          }
        >
          <OverallStatsContent chain={chain} timeframe={timeframe} />
          <ErrorBoundary
            fallback={<p>There was an error loading the discover data</p>}
          >
            <Suspense
              key={`${view}:${chain ?? "all"}:${timeframe}:${page}:${sorting.id}:${sorting.desc}`}
              fallback={<LoadingDiscoverServices sorting={sorting} />}
            >
              <DiscoverServices
                chain={chain}
                page={page}
                sorting={sorting}
                timeframe={timeframe}
                view={view}
              />
            </Suspense>
          </ErrorBoundary>
        </UsageSection>
      </main>
    </HydrateClient>
  );
}
