import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

import { PageHeading } from "@/components/page-heading";
import { TimeframeSelect } from "@/components/timeframe-select";

import { parseChain } from "@/app/(app)/_lib/chain/parse";
import {
  DEFAULT_NETWORKS_SORTING,
  NETWORKS_SORT_IDS,
} from "@/lib/table-sort-options";
import { parseTableSorting } from "@/lib/table-state";
import { parseUsageTimeframe } from "@/lib/timeframe";
import { api, HydrateClient } from "@/trpc/server";

import { NetworksChart, LoadingNetworksChart } from "./_components/chart";
import { NetworksTable, LoadingNetworksTable } from "./_components/networks";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Networks",
  description: "Top networks processing x402 transactions",
};

export default function NetworksPage({ searchParams }: PageProps<"/networks">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
      <PageHeading
        title="Networks"
        description="Top networks processing x402 transactions"
        actions={
          <Suspense fallback={<Skeleton className="h-8 w-20 sm:w-64" />}>
            <Timeframe searchParams={searchParams} />
          </Suspense>
        }
      />
      <section className="space-y-4">
        <Suspense fallback={<LoadingNetworksChart />}>
          <Chart searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<LoadingNetworksTable />}>
          <Table searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}

async function readFilters(
  searchParams: PageProps<"/networks">["searchParams"]
) {
  const params = await searchParams;
  return {
    chain: parseChain(params.chain),
    timeframe: parseUsageTimeframe(params.d),
    sorting: parseTableSorting(
      params,
      NETWORKS_SORT_IDS,
      DEFAULT_NETWORKS_SORTING
    ),
  };
}

async function Timeframe({
  searchParams,
}: Pick<PageProps<"/networks">, "searchParams">) {
  const { timeframe } = await readFilters(searchParams);
  return <TimeframeSelect timeframe={timeframe} />;
}

async function Chart({
  searchParams,
}: Pick<PageProps<"/networks">, "searchParams">) {
  const { chain, timeframe } = await readFilters(searchParams);
  void api.networks.bucketedStatistics.prefetch({
    numBuckets: 48,
    timeframe,
    chain,
  });
  return (
    <HydrateClient>
      <Suspense
        key={`${chain ?? "all"}:${String(timeframe)}`}
        fallback={<LoadingNetworksChart />}
      >
        <NetworksChart chain={chain} timeframe={timeframe} />
      </Suspense>
    </HydrateClient>
  );
}

async function Table({
  searchParams,
}: Pick<PageProps<"/networks">, "searchParams">) {
  const { chain, timeframe, sorting } = await readFilters(searchParams);
  void api.networks.list.prefetch({ sorting, timeframe, chain });
  return (
    <HydrateClient>
      <Suspense
        key={`${chain ?? "all"}:${String(timeframe)}:${sorting.id}:${String(sorting.desc)}`}
        fallback={<LoadingNetworksTable sorting={sorting} />}
      >
        <NetworksTable chain={chain} timeframe={timeframe} sorting={sorting} />
      </Suspense>
    </HydrateClient>
  );
}
