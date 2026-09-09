import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { TimeframeSelect } from "@/components/timeframe-select";
import { Separator } from "@/components/ui/separator";
import { UsageSection } from "@/components/usage-section";

import { parseChain } from "@/app/(app)/_lib/chain/parse";
import {
  parseDiscoverPage,
  parseServiceView,
  SERVICES_PAGE_SIZE,
} from "@/lib/discover/filters";
import {
  DEFAULT_SELLERS_SORTING,
  SELLERS_SORT_IDS,
} from "@/lib/table-sort-options";
import { parseTableSorting } from "@/lib/table-state";
import { parseUsageTimeframe } from "@/lib/timeframe";
import { api, HydrateClient } from "@/trpc/server";

import {
  DiscoverServices,
  LoadingDiscoverServices,
} from "./_components/discover-origins";
import { DiscoverHeading } from "./_components/heading";
import { LoadingDiscoverUsage } from "./_components/loading-usage";
import { ServiceViewToggle } from "./_components/service-view-toggle";
import { OverallStatsContent } from "./_components/stats";

export default function DiscoverPage({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
      <DiscoverHeading />
      <Suspense fallback={<LoadingDiscoverUsage />}>
        <DiscoverUsage searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function DiscoverUsage({
  searchParams,
}: Pick<PageProps<"/">, "searchParams">) {
  const resolvedParams = await searchParams;
  const chain = parseChain(resolvedParams.chain);
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
            key={`${view}:${chain ?? "all"}:${String(timeframe)}:${String(page)}:${sorting.id}:${String(sorting.desc)}`}
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
    </HydrateClient>
  );
}
