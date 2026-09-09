import { Suspense } from "react";

import { Body, Heading } from "@/app/_components/layout/page-utils";

import {
  LatestTransactionsTable,
  LoadingLatestTransactionsTable,
} from "../_components/transactions/table";

import { HydrateClient } from "@/trpc/server";
import { parseTableSorting } from "@/lib/table-state";
import {
  DEFAULT_TRANSFERS_SORTING,
  TRANSFERS_SORT_IDS,
} from "@/lib/table-sort-options";

export default async function BuyerTransactionsPage({
  params,
  searchParams,
}: PageProps<"/buyer/[address]/transactions">) {
  const { address } = await params;
  const sorting = parseTableSorting(
    await searchParams,
    TRANSFERS_SORT_IDS,
    DEFAULT_TRANSFERS_SORTING
  );

  const pageSize = 10;

  return (
    <HydrateClient>
      <Heading
        title="Transactions"
        description="x402 transactions from this buyer address"
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
            address={address}
            pageSize={pageSize}
            sorting={sorting}
          />
        </Suspense>
      </Body>
    </HydrateClient>
  );
}
