"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Chains } from "@/app/(app)/_components/chains";
import { facilitatorServerColumns, type FacilitatorServer } from "./columns";
import {
  LoadingServiceSummary,
  ServiceSummary,
} from "@/components/service-summary";
import {
  ResponsiveCollection,
  ResponsiveCollectionLoading,
} from "@/components/responsive-collection";
import { Skeleton } from "@/components/ui/skeleton";
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
    <Link href={getRowHref(item)} className="flex items-center gap-4 py-4">
      <ServiceSummary
        className="flex-1"
        descriptionPlacement="below"
        item={item}
        nameVariant="card-title"
      />
      <Chains chains={item.chains} className="shrink-0" />
    </Link>
  ),
  renderLoadingItem: () => (
    <div className="flex items-center gap-4 py-4">
      <LoadingServiceSummary className="flex-1" />
      <Skeleton className="size-4 shrink-0" />
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
