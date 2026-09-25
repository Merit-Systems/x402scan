import { Suspense } from "react";

import { DataTableLoading } from "@/components/ui/data-table";

import { Section } from "@/app/_components/layout/page-utils";

import { LatestTransactionsTable } from "../../../_components/transactions/table";

import { overviewColumns } from "../../../_components/transactions/columns";

import { api, HydrateClient } from "@/trpc/server";

import { DEFAULT_TRANSFERS_SORTING } from "@/lib/table-sort-options";

import { ActivityTimeframe } from "@/types/timeframes";

interface Props {
  facilitatorId: string;
}

export const LatestTransactions: React.FC<Props> = ({ facilitatorId }) => {
  const pageSize = 10;

  void api.public.transfers.list.prefetch({
    pagination: {
      page_size: pageSize,
    },
    facilitatorIds: [facilitatorId],
    timeframe: ActivityTimeframe.ThirtyDays,
    sorting: DEFAULT_TRANSFERS_SORTING,
  });

  return (
    <HydrateClient>
      <LatestTransactionsTableContainer>
        <Suspense
          fallback={
            <LoadingLatestTransactionsTable loadingRowCount={pageSize} />
          }
        >
          <LatestTransactionsTable
            facilitatorId={facilitatorId}
            pageSize={pageSize}
          />
        </Suspense>
      </LatestTransactionsTableContainer>
    </HydrateClient>
  );
};

export const LoadingLatestTransactions = ({
  loadingRowCount,
}: {
  loadingRowCount: number;
}) => {
  return (
    <LatestTransactionsTableContainer>
      <LoadingLatestTransactionsTable loadingRowCount={loadingRowCount} />
    </LatestTransactionsTableContainer>
  );
};

const LoadingLatestTransactionsTable = ({
  loadingRowCount,
}: {
  loadingRowCount: number;
}) => {
  return (
    <DataTableLoading columns={overviewColumns} rowCount={loadingRowCount} />
  );
};

const LatestTransactionsTableContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Section
      title="Transactions"
      description="x402 transactions submitted by this facilitator"
    >
      {children}
    </Section>
  );
};
