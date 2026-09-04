"use client";

import { Chains } from "./chains";
import {
  LoadingServiceSummary,
  ServiceSummary,
} from "@/components/service-summary";
import {
  DataTableColumnHeader,
  type DataTableColumnDef,
} from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline, SparklineLoading } from "@/components/ui/sparkline";
import { formatTokenAmount } from "@/lib/token";
import { formatCompactAgo } from "@/lib/utils";

import type { RouterOutputs } from "@/trpc/client";
import type { ReactNode } from "react";

type ServiceSummaryItem =
  RouterOutputs["public"]["sellers"]["bazaar"]["summaries"]["items"][number];

export function createServiceColumnSet<T extends ServiceSummaryItem>({
  enableMetricSorting = true,
}: {
  enableMetricSorting?: boolean;
} = {}) {
  const server: DataTableColumnDef<T> = {
    id: "editorial",
    accessorKey: "origins",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Server"
        className="justify-start"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex h-13 items-center pr-4">
        <ServiceSummary item={row.original} />
      </div>
    ),
    size: 400,
    meta: {
      loadingCell: <LoadingServiceSummary className="h-13 pr-4" />,
    },
  };
  const volume: DataTableColumnDef<T> = {
    accessorKey: "total_amount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Volume"
        className="w-full justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <ServiceMetricCell>
        {formatTokenAmount(BigInt(row.original.total_amount))}
      </ServiceMetricCell>
    ),
    enableSorting: enableMetricSorting,
    size: 110,
    meta: {
      cellClassName: "text-center",
      headerClassName: "text-center",
      loadingCell: <Skeleton className="mx-auto h-4 w-16" />,
    },
  };
  const transactions: DataTableColumnDef<T> = {
    accessorKey: "tx_count",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Txns"
        className="w-full justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <ServiceMetricCell>
        {formatCompactNumber(row.original.tx_count)}
      </ServiceMetricCell>
    ),
    enableSorting: enableMetricSorting,
    size: 90,
    meta: {
      cellClassName: "text-center",
      headerClassName: "text-center",
      loadingCell: <Skeleton className="mx-auto h-4 w-12" />,
    },
  };
  const buyers: DataTableColumnDef<T> = {
    accessorKey: "unique_buyers",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Buyers"
        className="w-full justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <ServiceMetricCell>
        {formatCompactNumber(row.original.unique_buyers)}
      </ServiceMetricCell>
    ),
    enableSorting: enableMetricSorting,
    size: 90,
    meta: {
      cellClassName: "text-center",
      headerClassName: "text-center",
      loadingCell: <Skeleton className="mx-auto h-4 w-12" />,
    },
  };
  const latest: DataTableColumnDef<T> = {
    accessorKey: "latest_block_timestamp",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Latest"
        className="w-full justify-center [&>button]:ml-0"
      />
    ),
    cell: ({ row }) => (
      <ServiceMetricCell>
        {row.original.latest_block_timestamp
          ? formatCompactAgo(row.original.latest_block_timestamp)
          : "–"}
      </ServiceMetricCell>
    ),
    enableSorting: enableMetricSorting,
    size: 90,
    meta: {
      cellClassName: "text-center",
      headerClassName: "text-center",
      loadingCell: <Skeleton className="mx-auto h-4 w-12" />,
    },
  };
  const chain: DataTableColumnDef<T> = {
    accessorKey: "chains",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Chain"
        className="w-full justify-center"
      />
    ),
    enableSorting: false,
    cell: ({ row }) => (
      <Chains
        chains={row.original.chains}
        iconClassName="size-4"
        className="mx-auto justify-center"
      />
    ),
    size: 70,
    meta: {
      cellClassName: "text-center",
      headerClassName: "text-center",
      loadingCell: <Skeleton className="mx-auto size-4" />,
    },
  };

  return { buyers, chain, latest, server, transactions, volume };
}

export function createServiceActivityColumn<T extends ServiceSummaryItem>(
  getActivity: (item: T) => number[]
): DataTableColumnDef<T> {
  return {
    accessorKey: "chart",
    header: () => null,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="h-5">
        <Sparkline className="h-full" values={getActivity(row.original)} />
      </div>
    ),
    size: 64,
    meta: {
      loadingCell: (
        <div className="h-5">
          <SparklineLoading className="h-full" />
        </div>
      ),
    },
  };
}

export function ServiceMetricsGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-2">{children}</div>
  );
}

export function ServiceVolumeMetric({ item }: { item: ServiceSummaryItem }) {
  return (
    <ServiceMetric
      label="Volume"
      value={formatTokenAmount(BigInt(item.total_amount))}
    />
  );
}

export function ServiceTransactionsMetric({
  item,
}: {
  item: ServiceSummaryItem;
}) {
  return (
    <ServiceMetric label="Txns" value={formatCompactNumber(item.tx_count)} />
  );
}

export function ServiceBuyersMetric({ item }: { item: ServiceSummaryItem }) {
  return (
    <ServiceMetric
      label="Buyers"
      value={formatCompactNumber(item.unique_buyers)}
    />
  );
}

export function ServiceLatestMetric({ item }: { item: ServiceSummaryItem }) {
  return (
    <ServiceMetric
      label="Latest"
      value={
        item.latest_block_timestamp
          ? formatCompactAgo(item.latest_block_timestamp)
          : "—"
      }
    />
  );
}

export function LoadingServiceMetric() {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Skeleton className="h-3 w-8" />
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

function ServiceMetricCell({ children }: { children: React.ReactNode }) {
  return <div className="w-full text-center type-caption">{children}</div>;
}

function ServiceMetric({ label, value }: { label: string; value: string }) {
  return (
    <dl className="min-w-0">
      <dt className="truncate type-caption text-muted-foreground">{label}</dt>
      <dd className="type-numeric type-supporting-body truncate">{value}</dd>
    </dl>
  );
}

function formatCompactNumber(value: number) {
  return value.toLocaleString(undefined, {
    notation: "compact",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}
