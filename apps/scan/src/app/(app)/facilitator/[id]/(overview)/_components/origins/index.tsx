"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ResponsiveCollection,
  ResponsiveCollectionLoading,
} from "@/components/responsive-collection";
import {
  LoadingServiceSummary,
  ServiceSummary,
} from "@/components/service-summary";

import {
  LoadingServiceMetric,
  ServiceBuyersMetric,
  ServiceMetricsGrid,
  ServiceTransactionsMetric,
  ServiceVolumeMetric,
} from "@/app/(app)/_components/service-collection";

import { facilitatorServerColumns } from "./columns";

import type { Route } from "next";

import type { DataListItem } from "@/components/ui/data-list";

import type { listBazaarOriginSummaries } from "@/services/db/bazaar/origins";

import type { FacilitatorServer } from "./columns";

const PAGE_SIZE = 10;

interface FacilitatorOriginsProps {
  origins: Awaited<ReturnType<typeof listBazaarOriginSummaries>>;
}

export function FacilitatorOrigins({ origins }: FacilitatorOriginsProps) {
  const router = useRouter();
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
      <ServiceMetricsGrid>
        <ServiceVolumeMetric item={item} />
        <ServiceTransactionsMetric item={item} />
        <ServiceBuyersMetric item={item} />
      </ServiceMetricsGrid>
    </Link>
  ),
  renderLoadingItem: () => (
    <div className="flex flex-col gap-3 py-4">
      <LoadingServiceSummary />
      <ServiceMetricsGrid>
        {Array.from({ length: 3 }, (_, metricIndex) => (
          <LoadingServiceMetric key={metricIndex} />
        ))}
      </ServiceMetricsGrid>
    </div>
  ),
};

function getRowHref(item: FacilitatorServer): Route {
  const origin = item.origins[0];
  if (!origin) {
    throw new Error("A server row must have an origin");
  }
  // Next's generated Route union cannot model an identifier interpolated at runtime.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return `/server/${origin.id}` as Route;
}

function getServerName(item: FacilitatorServer) {
  const origin = item.origins[0];
  if (!origin) return "server";

  return origin.title?.trim() ?? new URL(origin.origin).hostname;
}
