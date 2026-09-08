import { LoadingOverallStatsContent } from "./stats";
import { LoadingDiscoverServices } from "./discover-origins";
import { DEFAULT_SELLERS_SORTING } from "@/lib/table-sort-options";
import { UsageSection } from "@/components/usage-section";
import { Skeleton } from "@/components/ui/skeleton";

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
