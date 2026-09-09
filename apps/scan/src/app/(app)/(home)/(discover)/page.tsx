import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { OverallStats } from "../(overview)/_components/stats";
// import { AgentCashAnnouncementBanner } from '../_components/v2-announcement-banner';
import { DiscoverHeading } from "./_components/heading";

import { api, HydrateClient } from "@/trpc/server";

import { getChainForPage } from "@/app/(app)/_lib/chain/page";

import {
  DiscoverSellersTable,
  LoadingDiscoverSellersTable,
} from "./_components/discover-origins";
import { DiscoverPageContent } from "./_components/discover-page-content";

import { defaultSellersSorting } from "@/app/(app)/_contexts/sorting/sellers/default";
import { SellersSortingProvider } from "@/app/(app)/_contexts/sorting/sellers/provider";

import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";
import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";
import { ActivityTimeframe } from "@/types/timeframes";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const chain = await getChainForPage(resolvedParams);

  void api.public.sellers.bazaar.featured.prefetch({
    chain,
    pagination: {
      page_size: 400,
    },
    timeframe: ActivityTimeframe.ThirtyDays,
    sorting: defaultSellersSorting,
  });

  return (
    <HydrateClient>
      <SellersSortingProvider initialSorting={defaultSellersSorting}>
        <TimeRangeProvider initialTimeframe={ActivityTimeframe.ThirtyDays}>
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
            <DiscoverHeading />
            <DiscoverPageContent>
              {/* <AgentCashAnnouncementBanner /> */}
              <OverallStats
                chain={chain}
                initialTimeframe={ActivityTimeframe.ThirtyDays}
              />
              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1">
                    <h2 className="type-section-title">Featured services</h2>
                    <p className="text-muted-foreground">
                      Curated APIs with recent x402 activity.
                    </p>
                  </div>
                  <RangeSelector />
                </div>
                <ErrorBoundary
                  fallback={<p>There was an error loading the discover data</p>}
                >
                  <Suspense fallback={<LoadingDiscoverSellersTable />}>
                    <DiscoverSellersTable />
                  </Suspense>
                </ErrorBoundary>
              </section>
            </DiscoverPageContent>
          </main>
        </TimeRangeProvider>
      </SellersSortingProvider>
    </HydrateClient>
  );
}
