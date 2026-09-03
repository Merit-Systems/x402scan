"use client";

import {
  createServiceActivityColumn,
  createServiceColumnSet,
} from "@/app/(app)/_components/service-collection";

import type { RouterOutputs } from "@/trpc/client";

type BazaarItem =
  RouterOutputs["public"]["sellers"]["bazaar"]["list"]["items"][number];

export type ServiceItem = BazaarItem;

const columns = createServiceColumnSet<ServiceItem>();

export const serviceColumns = [
  columns.server,
  createServiceActivityColumn<ServiceItem>((item) => item.transactionSparkline),
  columns.volume,
  columns.transactions,
  columns.buyers,
  columns.latest,
  columns.chain,
];
