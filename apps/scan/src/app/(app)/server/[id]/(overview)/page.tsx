import { Suspense } from "react";

import { ServerOverview } from "./_components/overview";
import {
  LoadingOriginResources,
  OriginResources,
} from "./_components/resources";
import {
  LoadingServerStatCards,
  ServerStatCards,
} from "./_components/stat-cards";
import { UsageErrorBoundary } from "./_components/usage-error-boundary";

import { ActivityTimeframe } from "@/types/timeframes";
import { api, HydrateClient } from "@/trpc/server";

import { notFound } from "next/navigation";

export default async function OriginPage({
  params,
}: PageProps<"/server/[id]">) {
  const { id } = await params;
  const origin = await api.public.origins.get(id);

  if (!origin) {
    notFound();
  }

  await Promise.all([
    api.public.stats.overallByOrigin.prefetch({
      originId: id,
      timeframe: ActivityTimeframe.ThirtyDays,
    }),
    api.public.stats.bucketedByOrigin.prefetch({
      originId: id,
      numBuckets: 48,
      timeframe: ActivityTimeframe.ThirtyDays,
    }),
  ]);

  return (
    <HydrateClient>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-12 md:space-y-12">
        <ServerOverview origin={origin} />
        <UsageErrorBoundary>
          <Suspense fallback={<LoadingServerStatCards />}>
            <ServerStatCards originId={id} />
          </Suspense>
        </UsageErrorBoundary>
        <Suspense fallback={<LoadingOriginResources />}>
          <OriginResources originId={id} />
        </Suspense>
      </main>
    </HydrateClient>
  );
}
