import { Suspense } from "react";

import { notFound } from "next/navigation";

import { TimeframeSelect } from "@/components/timeframe-select";
import { Skeleton } from "@/components/ui/skeleton";

import { parseChain } from "@/app/(app)/_lib/chain/parse";
import { facilitatorIdMap } from "@/lib/facilitators";
import { parseUsageTimeframe } from "@/lib/timeframe";
import { api, HydrateClient } from "@/trpc/server";

import {
  FacilitatorServersErrorBoundary,
  FacilitatorUsageErrorBoundary,
} from "./_components/error-boundaries";
import {
  FacilitatorOrigins,
  LoadingFacilitatorOrigins,
} from "./_components/origins";
import { FACILITATOR_SERVERS_SORTING } from "./_components/origins/config";
import {
  FacilitatorOverview,
  LoadingFacilitatorOverview,
} from "./_components/overview";
import {
  FacilitatorStatCards,
  LoadingFacilitatorStatCards,
} from "./_components/stat-cards";

import type { Metadata } from "next";

export default function FacilitatorPage(props: PageProps<"/facilitator/[id]">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-12 md:space-y-12">
      <Suspense
        fallback={
          <LoadingFacilitatorOverview
            controls={<Skeleton className="h-8 w-48" />}
          />
        }
      >
        <Overview {...props} />
      </Suspense>
      <FacilitatorUsageErrorBoundary>
        <Suspense fallback={<LoadingFacilitatorStatCards />}>
          <Statistics {...props} />
        </Suspense>
      </FacilitatorUsageErrorBoundary>
      <FacilitatorServersErrorBoundary>
        <Suspense fallback={<LoadingFacilitatorOrigins />}>
          <Servers {...props} />
        </Suspense>
      </FacilitatorServersErrorBoundary>
    </main>
  );
}

async function readFilters({
  params,
  searchParams,
}: PageProps<"/facilitator/[id]">) {
  const { id } = await params;
  const filters = await searchParams;
  const facilitator = facilitatorIdMap.get(id);
  if (!facilitator) notFound();
  return {
    id,
    facilitator,
    chain: parseChain(filters.chain),
    timeframe: parseUsageTimeframe(filters.d),
  };
}

async function Overview(props: PageProps<"/facilitator/[id]">) {
  const { facilitator, timeframe } = await readFilters(props);
  return (
    <FacilitatorOverview
      facilitator={facilitator}
      controls={<TimeframeSelect timeframe={timeframe} />}
    />
  );
}

async function Statistics(props: PageProps<"/facilitator/[id]">) {
  const { id, chain, timeframe } = await readFilters(props);
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
  return (
    <HydrateClient>
      <Suspense
        key={`${chain ?? "all"}:${String(timeframe)}`}
        fallback={<LoadingFacilitatorStatCards />}
      >
        <FacilitatorStatCards
          chain={chain}
          facilitatorId={id}
          timeframe={timeframe}
        />
      </Suspense>
    </HydrateClient>
  );
}

async function Servers(props: PageProps<"/facilitator/[id]">) {
  const { id, chain, timeframe } = await readFilters(props);
  void api.public.sellers.bazaar.featuredSummaries.prefetch({
    chain,
    facilitatorIds: [id],
    pagination: { page: 0, page_size: 10 },
    sorting: FACILITATOR_SERVERS_SORTING,
    timeframe,
  });
  return (
    <HydrateClient>
      <Suspense
        key={`${chain ?? "all"}:${String(timeframe)}`}
        fallback={<LoadingFacilitatorOrigins />}
      >
        <FacilitatorOrigins
          chain={chain}
          facilitatorId={id}
          timeframe={timeframe}
        />
      </Suspense>
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
