import { Suspense } from "react";

import { notFound } from "next/navigation";

import { FacilitatorOverview } from "./_components/overview";
import {
  FacilitatorStatCards,
  LoadingFacilitatorStatCards,
} from "./_components/stat-cards";
import {
  FacilitatorOrigins,
  LoadingFacilitatorOrigins,
} from "./_components/origins";
import { FACILITATOR_SERVERS_SORTING } from "./_components/origins/config";
import {
  FacilitatorServersErrorBoundary,
  FacilitatorUsageErrorBoundary,
} from "./_components/error-boundaries";

import { getChainForPage } from "@/app/(app)/_lib/chain/page";
import { TimeframeSelect } from "@/components/timeframe-select";
import { facilitatorIdMap } from "@/lib/facilitators";
import { parseUsageTimeframe } from "@/lib/timeframe";
import { api, HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export default async function FacilitatorPage({
  params,
  searchParams,
}: PageProps<"/facilitator/[id]">) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const facilitator = facilitatorIdMap.get(id);
  if (!facilitator) {
    return notFound();
  }

  const chain = await getChainForPage(resolvedSearchParams);
  const timeframe = parseUsageTimeframe(resolvedSearchParams.d);
  void api.public.stats.overall.prefetch({
    chain,
    facilitatorIds: [id],
    timeframe,
  });
  void api.public.stats.bucketed.prefetch({
    chain,
    facilitatorIds: [id],
    numBuckets: 48,
    timeframe,
  });
  void api.public.sellers.bazaar.featuredSummaries.prefetch({
    chain,
    facilitatorIds: [id],
    pagination: { page: 0, page_size: 10 },
    sorting: FACILITATOR_SERVERS_SORTING,
    timeframe,
  });

  return (
    <HydrateClient>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-12 md:space-y-12">
        <FacilitatorOverview
          controls={<TimeframeSelect timeframe={timeframe} />}
          facilitator={facilitator}
        />
        <FacilitatorUsageErrorBoundary>
          <Suspense
            key={`usage:${chain ?? "all"}:${String(timeframe)}`}
            fallback={<LoadingFacilitatorStatCards />}
          >
            <FacilitatorStatCards
              chain={chain}
              facilitatorId={id}
              timeframe={timeframe}
            />
          </Suspense>
        </FacilitatorUsageErrorBoundary>
        <FacilitatorServersErrorBoundary>
          <Suspense
            key={`servers:${chain ?? "all"}:${String(timeframe)}`}
            fallback={<LoadingFacilitatorOrigins />}
          >
            <FacilitatorOrigins
              chain={chain}
              facilitatorId={id}
              timeframe={timeframe}
            />
          </Suspense>
        </FacilitatorServersErrorBoundary>
      </main>
    </HydrateClient>
  );
}

export const generateMetadata = async ({
  params,
}: PageProps<"/facilitator/[id]">): Promise<Metadata> => {
  const { id } = await params;
  const facilitator = facilitatorIdMap.get(id);
  if (!facilitator) {
    return { title: "Facilitator not found" };
  }
  return {
    title: facilitator.name,
    description: `x402 activity for the ${facilitator.name} facilitator`,
    alternates: {
      canonical: `/facilitator/${id}`,
    },
  };
};
