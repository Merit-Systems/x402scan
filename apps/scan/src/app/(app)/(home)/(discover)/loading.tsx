import { UsageSection } from "@/components/usage-section";

import { DEFAULT_SELLERS_SORTING } from "@/lib/table-sort-options";

import { LoadingDiscoverServices } from "./_components/discover-origins";
import { DiscoverHeading } from "./_components/heading";
import { LoadingOverallStatsContent } from "./_components/stats";

export default function LoadingDiscover() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
      <DiscoverHeading />
      <UsageSection aria-busy="true">
        <LoadingOverallStatsContent />
        <LoadingDiscoverServices sorting={DEFAULT_SELLERS_SORTING} />
      </UsageSection>
    </main>
  );
}
