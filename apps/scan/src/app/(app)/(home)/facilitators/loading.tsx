import { Card } from "@/components/ui/card";
import { PageHeading } from "@/components/page-heading";
import { UsageSection } from "@/components/usage-section";

import { LoadingFacilitatorsChart } from "./_components/chart";
import { LoadingFacilitatorsTable } from "./_components/facilitators";
export default function LoadingFacilitatorsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
      <PageHeading
        title="Facilitators"
        description="Top facilitators processing x402 transactions"
      />
      <UsageSection aria-busy="true">
        <Card className="overflow-hidden">
          <LoadingFacilitatorsChart />
        </Card>
        <LoadingFacilitatorsTable pageSize={10} />
      </UsageSection>
    </main>
  );
}
