import { Skeleton } from "@/components/ui/skeleton";
import { UsageSection } from "@/components/usage-section";

import { DEFAULT_SELLERS_SORTING } from "@/lib/table-sort-options";

import { LoadingDiscoverServices } from "./discover-origins";
import { LoadingOverallStatsContent } from "./stats";

export function LoadingDiscoverUsage() {
  return (
    <UsageSection
      aria-busy="true"
      controls={<Skeleton className="h-8 w-40 sm:w-80" />}
    >
      <LoadingOverallStatsContent />
      <LoadingDiscoverServices sorting={DEFAULT_SELLERS_SORTING} />
    </UsageSection>
  );
}
