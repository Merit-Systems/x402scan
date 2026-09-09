import { Suspense } from "react";

import { Body, Heading } from "@/app/(app)/_components/deferred/page-utils";
import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";
import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";
import { AgentsTable } from "@/app/(app)/composer/agents/(table)/_components/table";
import {
  AGENTS_SORT_IDS,
  DEFAULT_AGENTS_SORTING,
} from "@/lib/table-sort-options";
import { parseTableSorting } from "@/lib/table-state";
import { ActivityTimeframe } from "@/types/timeframes";

import { LoadingAgentsTable } from "./_components/table/table";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents",
  description: "Discover the most popular agents on x402scan",
};

export default function AgentsPage({
  searchParams,
}: PageProps<"/composer/agents">) {
  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
      <Heading
        title="Agents"
        description="Discover the most popular agents on x402scan"
        actions={<RangeSelector />}
      />
      <Body>
        <Suspense fallback={<LoadingAgentsTable />}>
          <SortedAgents searchParams={searchParams} />
        </Suspense>
      </Body>
    </TimeRangeProvider>
  );
}

async function SortedAgents({
  searchParams,
}: Pick<PageProps<"/composer/agents">, "searchParams">) {
  const sorting = parseTableSorting(
    await searchParams,
    AGENTS_SORT_IDS,
    DEFAULT_AGENTS_SORTING
  );

  return (
    <AgentsTable
      input={{
        timeframe: ActivityTimeframe.OneDay,
      }}
      limit={10}
      sorting={sorting}
    />
  );
}
