"use client";

import { createServiceColumns } from "@/app/(app)/_components/service-collection";

import type { RouterOutputs } from "@/trpc/client";

type BazaarItem =
  RouterOutputs["public"]["sellers"]["bazaar"]["list"]["items"][number];

export type ServiceItem = BazaarItem;

export const serviceColumns = createServiceColumns<ServiceItem>({
  getActivity: (item) => item.transactionSparkline,
});
