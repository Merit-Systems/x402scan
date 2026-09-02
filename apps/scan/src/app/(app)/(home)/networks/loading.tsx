import { PageHeading } from "@/components/page-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingNetworksChart } from "./_components/chart";
import { LoadingNetworksTable } from "./_components/networks";

export default function LoadingNetworksPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
      <PageHeading
        title="Networks"
        description="Top networks processing x402 transactions"
        actions={<Skeleton className="h-8 w-20 sm:w-64" />}
      />
      <section aria-busy="true" className="space-y-4">
        <LoadingNetworksChart />
        <LoadingNetworksTable />
      </section>
    </main>
  );
}
