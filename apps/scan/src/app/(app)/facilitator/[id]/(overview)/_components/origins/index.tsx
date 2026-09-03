"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { facilitatorServerColumns, type FacilitatorServer } from "./columns";
import {
  LoadingServiceSummary,
  ServiceSummary,
} from "@/components/service-summary";
import {
  LoadingServiceUsageMetrics,
  ServiceUsageMetrics,
} from "@/app/(app)/_components/service-collection";
import {
  ResponsiveCollection,
  ResponsiveCollectionLoading,
} from "@/components/responsive-collection";
import { api } from "@/trpc/client";

import { FACILITATOR_SERVERS_SORTING } from "./config";

import type { DataListItem } from "@/components/ui/data-list";
import type { Chain } from "@/types/chain";
import type { ActivityTimeframe } from "@/types/timeframes";
import type { Route } from "next";

const PAGE_SIZE = 10;

export function FacilitatorOrigins({
  chain,
  facilitatorId,
  timeframe,
}: {
  chain?: Chain;
  facilitatorId: string;
  timeframe: ActivityTimeframe;
}) {
  const router = useRouter();
  const [origins] =
    api.public.sellers.bazaar.featuredSummaries.useSuspenseQuery({
      chain,
      facilitatorIds: [facilitatorId],
      pagination: { page: 0, page_size: PAGE_SIZE },
      sorting: FACILITATOR_SERVERS_SORTING,
      timeframe,
    });

  return (
    <ResponsiveCollection
      data={origins.items}
      emptyMessage="No featured servers found for this timeframe."
      list={{ item: facilitatorServerListItem }}
      table={{
        columns: facilitatorServerColumns,
        getRowHref,
        getRowLabel: (item) => `Open ${getServerName(item)}`,
        onRowMouseEnter: (item) => {
          router.prefetch(getRowHref(item));
        },
        pageSize: PAGE_SIZE,
      }}
    />
  );
}

export function LoadingFacilitatorOrigins() {
  return (
    <ResponsiveCollectionLoading
      rowCount={PAGE_SIZE}
      list={{ item: facilitatorServerListItem }}
      table={{ columns: facilitatorServerColumns }}
    />
  );
}

const facilitatorServerListItem: DataListItem<FacilitatorServer> = {
  getItemKey: (item, index) => item.origins[0]?.id ?? index,
  renderItem: ({ item }) => (
    <Link href={getRowHref(item)} className="flex flex-col gap-2 py-4">
      <ServiceSummary
        descriptionPlacement="below"
        item={item}
        nameVariant="card-title"
      />
      <ServiceUsageMetrics item={item} />
    </Link>
  ),
  renderLoadingItem: () => (
    <div className="flex flex-col gap-3 py-4">
      <LoadingServiceSummary />
      <LoadingServiceUsageMetrics />
    </div>
  ),
};

function getRowHref(item: FacilitatorServer): Route {
  const origin = item.origins[0];
  if (!origin) {
    throw new Error("A server row must have an origin");
  }
  return `/server/${origin.id}` as Route;
}

function getServerName(item: FacilitatorServer) {
  const origin = item.origins[0];
  if (!origin) return "server";

  return origin.title?.trim() ?? new URL(origin.origin).hostname;
}
