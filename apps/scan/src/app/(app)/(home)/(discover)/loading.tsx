import { DiscoverHeading } from "./_components/heading";
import { LoadingDiscoverUsage } from "./_components/loading-usage";

export default function LoadingDiscover() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-8 md:pt-4">
      <DiscoverHeading />
      <LoadingDiscoverUsage />
    </main>
  );
}
