import { DiscoverHeading } from "./_components/heading";
import { LoadingOverallStatsContent } from "../(overview)/_components/stats";
import { LoadingDiscoverSellersTable } from "./_components/discover-origins";
import { DEFAULT_SELLERS_SORTING } from "@/lib/table-sort-options";
import { UsageSection } from "@/components/usage-section";

export default function LoadingDiscover() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
      <DiscoverHeading />
      <UsageSection aria-busy="true">
        <LoadingOverallStatsContent />
        <LoadingDiscoverSellersTable sorting={DEFAULT_SELLERS_SORTING} />
      </UsageSection>
    </main>
  );
}
