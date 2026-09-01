import { DiscoverHeading } from "./_components/heading";
import { LoadingOverallStats } from "../(overview)/_components/stats";
import { LoadingDiscoverSellersTable } from "./_components/discover-origins";

export default function LoadingDiscover() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
      <DiscoverHeading />
      <LoadingOverallStats />
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="type-section-title">Featured services</h2>
          <p className="text-muted-foreground">
            Curated APIs with recent x402 activity.
          </p>
        </div>
        <LoadingDiscoverSellersTable />
      </section>
    </main>
  );
}
