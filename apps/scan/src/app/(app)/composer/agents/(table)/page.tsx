import { Body, Heading } from "@/app/_components/layout/page-utils";
import { AgentsTable } from "@/app/(app)/_components/agents/table";
import { ActivityTimeframe } from "@/types/timeframes";
import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";
import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";
import { parseTableSorting } from "@/lib/table-state";
import {
  AGENTS_SORT_IDS,
  DEFAULT_AGENTS_SORTING,
} from "@/lib/table-sort-options";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents",
  description: "Discover the most popular agents on x402scan",
};

export default async function AgentsPage({
  searchParams,
}: PageProps<"/composer/agents">) {
  const sorting = parseTableSorting(
    await searchParams,
    AGENTS_SORT_IDS,
    DEFAULT_AGENTS_SORTING
  );

  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.OneDay}>
      <Heading
        title="Agents"
        description="Discover the most popular agents on x402scan"
        actions={<RangeSelector />}
      />
      <Body>
        <AgentsTable
          input={{
            timeframe: ActivityTimeframe.OneDay,
          }}
          limit={10}
          sorting={sorting}
        />
      </Body>
    </TimeRangeProvider>
  );
}
