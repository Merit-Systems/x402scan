import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/page-heading";
import { UsageSection } from "@/components/usage-section";
import { LoadingNetworksChart } from "./_components/chart";
import { LoadingNetworksTable } from "./_components/networks";

export default function LoadingNetworksPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
      <PageHeading
        title="Networks"
        description="Top networks processing x402 transactions"
      />
      <UsageSection aria-busy="true">
        <Card className="overflow-hidden">
          <LoadingNetworksChart />
        </Card>
        <LoadingNetworksTable />
      </UsageSection>
    </main>
  );
}
