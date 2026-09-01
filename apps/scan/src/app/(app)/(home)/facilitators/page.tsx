import { Suspense } from "react";

import { Card } from "@/components/ui/card";

import { Body, Heading } from "@/app/_components/layout/page-utils";

import {
  FacilitatorsChart,
  LoadingFacilitatorsChart,
} from "./_components/chart";
import {
  FacilitatorsTable,
  LoadingFacilitatorsTable,
} from "./_components/facilitators";

import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";
import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";

import { api, HydrateClient } from "@/trpc/server";

import { getChainForPage } from "@/app/(app)/_lib/chain/page";

import { ActivityTimeframe } from "@/types/timeframes";
import { parseTableSorting } from "@/lib/table-state";
import {
  DEFAULT_FACILITATORS_SORTING,
  FACILITATORS_SORT_IDS,
} from "@/lib/table-sort-options";

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
  const sorting = parseTableSorting(
    resolvedSearchParams,
    FACILITATORS_SORT_IDS,
    DEFAULT_FACILITATORS_SORTING
  );

  void api.public.facilitators.bucketedStatistics.prefetch({
    numBuckets: 48,
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });
  void api.public.stats.overall.prefetch({
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });
  void api.public.facilitators.list.prefetch({
    pagination: {
      page_size: PAGE_SIZE,
    },
    sorting,
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });

  return (
    <HydrateClient>
      <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
        <Heading
          title="Facilitators"
          description="Top facilitators processing x402 transactions"
          actions={<RangeSelector />}
        />
        <Body>
          {/* <FacilitatorPackageBanner /> */}
          <Card className="overflow-hidden">
            <Suspense fallback={<LoadingFacilitatorsChart />}>
              <FacilitatorsChart />
            </Suspense>
          </Card>
          <Suspense
            fallback={
              <LoadingFacilitatorsTable
                pageSize={PAGE_SIZE}
                sorting={sorting}
              />
            }
          >
            <FacilitatorsTable pageSize={PAGE_SIZE} sorting={sorting} />
          </Suspense>
        </Body>
      </TimeRangeProvider>
    </HydrateClient>
  );
}
