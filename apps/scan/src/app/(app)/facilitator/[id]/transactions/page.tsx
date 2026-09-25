import { Suspense } from "react";

import { notFound } from "next/navigation";

import { Body, Heading } from "@/app/_components/layout/page-utils";

import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from "../_components/transactions/table";

import { api, HydrateClient } from "@/trpc/server";

import { facilitatorIdMap } from "@/lib/facilitators";

import { ActivityTimeframe } from "@/types/timeframes";
import { parseTableSorting } from "@/lib/table-state";
import {
  DEFAULT_TRANSFERS_SORTING,
  TRANSFERS_SORT_IDS,
} from "@/lib/table-sort-options";

import type { Metadata } from "next";

export default async function TransactionsPage({
  params,
  searchParams,
}: PageProps<"/facilitator/[id]/transactions">) {
  const { id } = await params;
  const sorting = parseTableSorting(
    await searchParams,
    TRANSFERS_SORT_IDS,
    DEFAULT_TRANSFERS_SORTING
  );

  const facilitator = facilitatorIdMap.get(id);

  if (!facilitator) {
    return notFound();
  }

  const pageSize = 10;

  void api.public.transfers.list.prefetch({
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    facilitatorIds: [id],
    timeframe: ActivityTimeframe.ThirtyDays,
    sorting,
  });

  return (
    <HydrateClient>
      <Heading
        title="Transactions"
        description="Transactions made through this facilitator"
      />
      <Body>
        <Suspense
          fallback={
            <LoadingLatestTransactionsTable
              loadingRowCount={pageSize}
              sorting={sorting}
            />
          }
        >
          <LatestTransactionsTable
            facilitatorId={id}
            pageSize={pageSize}
            sorting={sorting}
          />
        </Suspense>
      </Body>
    </HydrateClient>
  );
}

export const generateMetadata = async ({
  params,
}: PageProps<"/facilitator/[id]/transactions">): Promise<Metadata> => {
  const { id } = await params;
  const facilitator = facilitatorIdMap.get(id);
  if (!facilitator) {
    return { title: "Facilitator not found" };
  }
  return {
    title: `Transactions | ${facilitator.name}`,
    description: `x402 transactions through the ${facilitator.name} facilitator`,
  };
};
