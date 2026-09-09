import { Suspense } from "react";

import { PageHeading } from "@/components/page-heading";
import { TimeframeSelect } from "@/components/timeframe-select";
import { Skeleton } from "@/components/ui/skeleton";

import { parseChain } from "@/app/(app)/_lib/chain/parse";
import {
  DEFAULT_FACILITATORS_SORTING,
  FACILITATORS_SORT_IDS,
} from "@/lib/table-sort-options";
import { parseTableSorting } from "@/lib/table-state";
import { parseUsageTimeframe } from "@/lib/timeframe";
import {
  getBucketedFacilitatorsStatistics,
  bucketedStatisticsInputSchema,
} from "@/services/transfers/facilitators/bucketed";
import {
  listTopFacilitators,
  listTopFacilitatorsInputSchema,
} from "@/services/transfers/facilitators/list";

import {
  FacilitatorsChart,
  LoadingFacilitatorsChart,
} from "./_components/chart";
import {
  FacilitatorsTable,
  LoadingFacilitatorsTable,
} from "./_components/facilitators";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facilitators",
  description: "Top facilitators processing x402 transactions",
};

export default function FacilitatorsPage({
  searchParams,
}: PageProps<"/facilitators">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
      <PageHeading
        title="Facilitators"
        description="Top facilitators processing x402 transactions"
        actions={
          <Suspense fallback={<Skeleton className="h-8 w-20 sm:w-64" />}>
            <Timeframe searchParams={searchParams} />
          </Suspense>
        }
      />
      <section className="space-y-4">
        <Suspense fallback={<LoadingFacilitatorsChart />}>
          <Chart searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<LoadingFacilitatorsTable pageSize={10} />}>
          <Table searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}

async function readFilters(
  searchParams: PageProps<"/facilitators">["searchParams"]
) {
  const params = await searchParams;
  return {
    chain: parseChain(params.chain),
    timeframe: parseUsageTimeframe(params.d),
    sorting: parseTableSorting(
      params,
      FACILITATORS_SORT_IDS,
      DEFAULT_FACILITATORS_SORTING
    ),
  };
}

async function Timeframe({
  searchParams,
}: Pick<PageProps<"/facilitators">, "searchParams">) {
  const { timeframe } = await readFilters(searchParams);
  return <TimeframeSelect timeframe={timeframe} />;
}

async function Chart({
  searchParams,
}: Pick<PageProps<"/facilitators">, "searchParams">) {
  const { chain, timeframe } = await readFilters(searchParams);
  return (
    <Suspense
      key={`${chain ?? "all"}:${String(timeframe)}`}
      fallback={<LoadingFacilitatorsChart />}
    >
      <ChartData
        input={bucketedStatisticsInputSchema.parse({
          chain,
          timeframe,
          numBuckets: 48,
        })}
      />
    </Suspense>
  );
}

async function Table({
  searchParams,
}: Pick<PageProps<"/facilitators">, "searchParams">) {
  const { chain, timeframe, sorting } = await readFilters(searchParams);
  return (
    <Suspense
      key={`${chain ?? "all"}:${String(timeframe)}:${sorting.id}:${String(sorting.desc)}`}
      fallback={<LoadingFacilitatorsTable pageSize={10} sorting={sorting} />}
    >
      <TableData
        input={listTopFacilitatorsInputSchema.parse({
          chain,
          timeframe,
          sorting,
        })}
      />
    </Suspense>
  );
}

interface ChartDataProps {
  input: Parameters<typeof getBucketedFacilitatorsStatistics>[0];
}

async function ChartData({ input }: ChartDataProps) {
  return (
    <FacilitatorsChart
      bucketedFacilitatorData={await getBucketedFacilitatorsStatistics(input)}
    />
  );
}

interface TableDataProps {
  input: Parameters<typeof listTopFacilitators>[0];
}

async function TableData({ input }: TableDataProps) {
  return (
    <FacilitatorsTable
      facilitatorsData={await listTopFacilitators(input, {
        page: 0,
        page_size: 10,
      })}
      sorting={input.sorting}
      pageSize={10}
    />
  );
}
