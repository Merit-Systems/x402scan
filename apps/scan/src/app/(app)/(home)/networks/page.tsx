import { Suspense } from "react";

import { Card } from "@/components/ui/card";

import { Body, Heading } from "@/app/_components/layout/page-utils";

import { NetworksChart, LoadingNetworksChart } from "./_components/chart";
import { NetworksTable, LoadingNetworksTable } from "./_components/networks";

import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";
import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";
import { api, HydrateClient } from "@/trpc/server";

import { getChainForPage } from "@/app/(app)/_lib/chain/page";

import { ActivityTimeframe } from "@/types/timeframes";
import { parseTableSorting } from "@/lib/table-state";
import {
  DEFAULT_NETWORKS_SORTING,
  NETWORKS_SORT_IDS,
} from "@/lib/table-sort-options";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Networks",
  description: "Top networks processing x402 transactions",
};

export default async function NetworksPage({
  searchParams,
}: PageProps<"/networks">) {
  const resolvedSearchParams = await searchParams;
  const chain = await getChainForPage(resolvedSearchParams);
  const sorting = parseTableSorting(
    resolvedSearchParams,
    NETWORKS_SORT_IDS,
    DEFAULT_NETWORKS_SORTING
  );

  void api.networks.bucketedStatistics.prefetch({
    numBuckets: 48,
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });
  void api.public.stats.overall.prefetch({
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });
  void api.networks.list.prefetch({
    sorting,
    timeframe: ActivityTimeframe.OneDay,
    chain,
  });

  return (
    <HydrateClient>
      <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
        <Heading
          title="Networks"
          description="Top networks processing x402 transactions"
          actions={<RangeSelector />}
        />
        <Body>
          <Card className="overflow-hidden">
            <Suspense fallback={<LoadingNetworksChart />}>
              <NetworksChart />
            </Suspense>
          </Card>
          <Suspense fallback={<LoadingNetworksTable sorting={sorting} />}>
            <NetworksTable sorting={sorting} />
          </Suspense>
        </Body>
      </TimeRangeProvider>
    </HydrateClient>
  );
}
