import { LoadingFacilitatorOrigins } from "./_components/origins";
import { LoadingFacilitatorOverview } from "./_components/overview";
import { LoadingFacilitatorStatCards } from "./_components/stat-cards";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingFacilitatorPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-12 md:space-y-12">
      <LoadingFacilitatorOverview
        controls={<Skeleton className="h-8 w-48" />}
      />
      <LoadingFacilitatorStatCards />
      <LoadingFacilitatorOrigins />
    </main>
  );
}
