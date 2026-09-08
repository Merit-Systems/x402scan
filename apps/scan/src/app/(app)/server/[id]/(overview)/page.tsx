import { Suspense } from "react";

import { LoadingServerOverview } from "./_components/overview";
import { LoadingOriginResources } from "./_components/resources";
import { Overview, Statistics, Resources } from "./_components/sections";
import { LoadingServerStatCards } from "./_components/stat-cards";
import { UsageErrorBoundary } from "./_components/usage-error-boundary";

export default function OriginPage({ params }: PageProps<"/server/[id]">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-12 md:space-y-12">
      <Suspense fallback={<LoadingServerOverview />}>
        <Overview params={params} />
      </Suspense>
      <UsageErrorBoundary>
        <Suspense fallback={<LoadingServerStatCards />}>
          <Statistics params={params} />
        </Suspense>
      </UsageErrorBoundary>
      <Suspense fallback={<LoadingOriginResources />}>
        <Resources params={params} />
      </Suspense>
    </main>
  );
}
