import { Suspense } from "react";

import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/page-heading";
import { TimeframeSelect } from "@/components/timeframe-select";
import { UsageSection } from "@/components/usage-section";

import { NetworksChart, LoadingNetworksChart } from "./_components/chart";
import { NetworksTable, LoadingNetworksTable } from "./_components/networks";

import { api, HydrateClient } from "@/trpc/server";

import { getChainForPage } from "@/app/(app)/_lib/chain/page";

import { parseTableSorting } from "@/lib/table-state";
import {
  DEFAULT_NETWORKS_SORTING,
  NETWORKS_SORT_IDS,
} from "@/lib/table-sort-options";
import { parseUsageTimeframe } from "@/lib/timeframe";

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
  const timeframe = parseUsageTimeframe(resolvedSearchParams.d);
  const sorting = parseTableSorting(
    resolvedSearchParams,
    NETWORKS_SORT_IDS,
    DEFAULT_NETWORKS_SORTING
  );

  void api.networks.bucketedStatistics.prefetch({
    numBuckets: 48,
    timeframe,
    chain,
  });
  void api.public.stats.overall.prefetch({
    timeframe,
    chain,
  });
  void api.networks.list.prefetch({
    sorting,
    timeframe,
    chain,
  });

  return (
    <HydrateClient>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
        <PageHeading
          title="Networks"
          description="Top networks processing x402 transactions"
        />
        <UsageSection controls={<TimeframeSelect timeframe={timeframe} />}>
          <Card className="overflow-hidden">
            <Suspense
              key={`chart:${chain ?? "all"}:${timeframe}`}
              fallback={<LoadingNetworksChart />}
            >
              <NetworksChart chain={chain} timeframe={timeframe} />
            </Suspense>
          </Card>
          <Suspense
            key={`table:${chain ?? "all"}:${timeframe}:${sorting.id}:${sorting.desc}`}
            fallback={<LoadingNetworksTable sorting={sorting} />}
          >
            <NetworksTable
              chain={chain}
              sorting={sorting}
              timeframe={timeframe}
            />
          </Suspense>
        </UsageSection>
      </main>
    </HydrateClient>
  );
}
