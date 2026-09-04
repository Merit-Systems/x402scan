import { Suspense } from "react";

import { PageHeading } from "@/components/page-heading";
import { TimeframeSelect } from "@/components/timeframe-select";

import {
  FacilitatorsChart,
  LoadingFacilitatorsChart,
} from "./_components/chart";
import {
  FacilitatorsTable,
  LoadingFacilitatorsTable,
} from "./_components/facilitators";

import { api, HydrateClient } from "@/trpc/server";

import { getChainForPage } from "@/app/(app)/_lib/chain/page";

import { parseTableSorting } from "@/lib/table-state";
import {
  DEFAULT_FACILITATORS_SORTING,
  FACILITATORS_SORT_IDS,
} from "@/lib/table-sort-options";
import { parseUsageTimeframe } from "@/lib/timeframe";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facilitators",
  description: "Top facilitators processing x402 transactions",
};

const PAGE_SIZE = 10;

export default async function FacilitatorsPage({
  searchParams,
}: PageProps<"/facilitators">) {
  const resolvedSearchParams = await searchParams;
  const chain = await getChainForPage(resolvedSearchParams);
  const timeframe = parseUsageTimeframe(resolvedSearchParams.d);
  const sorting = parseTableSorting(
    resolvedSearchParams,
    FACILITATORS_SORT_IDS,
    DEFAULT_FACILITATORS_SORTING
  );

  void api.public.facilitators.bucketedStatistics.prefetch({
    numBuckets: 48,
    timeframe,
    chain,
  });
  void api.public.facilitators.list.prefetch({
    pagination: {
      page_size: PAGE_SIZE,
    },
    sorting,
    timeframe,
    chain,
  });

  return (
    <HydrateClient>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
        <PageHeading
          title="Facilitators"
          description="Top facilitators processing x402 transactions"
          actions={<TimeframeSelect timeframe={timeframe} />}
        />
        <section className="space-y-4">
          {/* <FacilitatorPackageBanner /> */}
          <Suspense
            key={`chart:${chain ?? "all"}:${timeframe}`}
            fallback={<LoadingFacilitatorsChart />}
          >
            <FacilitatorsChart chain={chain} timeframe={timeframe} />
          </Suspense>
          <Suspense
            key={`table:${chain ?? "all"}:${timeframe}:${sorting.id}:${sorting.desc}`}
            fallback={
              <LoadingFacilitatorsTable
                pageSize={PAGE_SIZE}
                sorting={sorting}
              />
            }
          >
            <FacilitatorsTable
              chain={chain}
              pageSize={PAGE_SIZE}
              sorting={sorting}
              timeframe={timeframe}
            />
          </Suspense>
        </section>
      </main>
    </HydrateClient>
  );
}
