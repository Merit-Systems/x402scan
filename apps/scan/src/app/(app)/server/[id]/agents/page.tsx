import { Body, Heading } from "@/app/_components/layout/page-utils";
import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";
import { AgentsTable } from "@/app/(app)/_components/agents/table";
import { ALL_TIME_TIMEFRAME } from "@/types/timeframes";
import { parseTableSorting } from "@/lib/table-state";
import {
  AGENTS_SORT_IDS,
  DEFAULT_AGENTS_SORTING,
} from "@/lib/table-sort-options";

export default async function OriginAgentsPage({
  params,
  searchParams,
}: PageProps<"/server/[id]/agents">) {
  const { id } = await params;
  const sorting = parseTableSorting(
    await searchParams,
    AGENTS_SORT_IDS,
    DEFAULT_AGENTS_SORTING
  );
  return (
    <TimeRangeProvider initialTimeframe={ALL_TIME_TIMEFRAME}>
      <Heading
        title="Agents"
        description="Agents using resources from this origin"
      />
      <Body>
        <AgentsTable
          input={{ originId: id, timeframe: ALL_TIME_TIMEFRAME }}
          limit={10}
          sorting={sorting}
        />
      </Body>
    </TimeRangeProvider>
  );
}
