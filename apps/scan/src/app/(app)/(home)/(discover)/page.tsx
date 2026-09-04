import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { OverallStatsContent } from "../(overview)/_components/stats";
// import { AgentCashAnnouncementBanner } from '../_components/v2-announcement-banner';
import { DiscoverHeading } from "./_components/heading";
import { ServiceViewToggle } from "./_components/service-view-toggle";
import { UsageTimeframeSelect } from "./_components/usage-timeframe-select";

import { api, HydrateClient } from "@/trpc/server";

import { getChainForPage } from "@/app/(app)/_lib/chain/page";

import {
  DiscoverSellersTable,
  LoadingDiscoverSellersTable,
} from "./_components/discover-origins";
import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";
import { ChartModeProvider } from "@/app/(app)/_contexts/chart-mode/provider";
import { UsageSection } from "@/components/usage-section";
import { Separator } from "@/components/ui/separator";
import {
  parseDiscoverPage,
  parseDiscoverTimeframe,
  parseServiceView,
  SERVICES_PAGE_SIZE,
} from "@/lib/discover/filters";
import { parseTableSorting } from "@/lib/table-state";
import {
  DEFAULT_SELLERS_SORTING,
  SELLERS_SORT_IDS,
} from "@/lib/table-sort-options";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const chain = await getChainForPage(resolvedParams);
  const sorting = parseTableSorting(
    resolvedParams,
    SELLERS_SORT_IDS,
    DEFAULT_SELLERS_SORTING
  );
  const timeframe = parseDiscoverTimeframe(resolvedParams.d);
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
      pagination: { page_size: 400 },
    });
  } else {
    void api.public.sellers.bazaar.list.prefetch({
      ...sellersInputBase,
      pagination: { page, page_size: SERVICES_PAGE_SIZE },
    });
  }

  return (
    <HydrateClient>
      <TimeRangeProvider key={timeframe} initialTimeframe={timeframe}>
        <ChartModeProvider>
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
            <DiscoverHeading />
            {/* <AgentCashAnnouncementBanner /> */}
            <UsageSection
              controls={
                <div className="flex flex-wrap items-center gap-0 sm:gap-2">
                  <ServiceViewToggle view={view} />
                  <Separator
                    orientation="vertical"
                    className="hidden sm:block"
                  />
                  <UsageTimeframeSelect timeframe={timeframe} />
                </div>
              }
            >
              <OverallStatsContent chain={chain} initialTimeframe={timeframe} />
              <ErrorBoundary
                fallback={<p>There was an error loading the discover data</p>}
              >
                <Suspense
                  key={`${view}:${timeframe}:${page}:${sorting.id}:${sorting.desc}`}
                  fallback={<LoadingDiscoverSellersTable sorting={sorting} />}
                >
                  <DiscoverSellersTable
                    page={page}
                    sorting={sorting}
                    view={view}
                  />
                </Suspense>
              </ErrorBoundary>
            </UsageSection>
          </main>
        </ChartModeProvider>
      </TimeRangeProvider>
    </HydrateClient>
  );
}
