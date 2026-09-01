import { Suspense } from "react";

import { DataTableLoading } from "@/components/ui/data-table";

import { overviewColumns } from "../../../_components/transactions/columns";
import { LatestTransactionsTable } from "../../../_components/transactions/table";

import { api, HydrateClient } from "@/trpc/server";
import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";
import { Section } from "@/app/_components/layout/page-utils";
import { ActivityTimeframe } from "@/types/timeframes";
import { DEFAULT_TRANSFERS_SORTING } from "@/lib/table-sort-options";

interface Props {
  address: string;
}

export const LatestTransactions: React.FC<Props> = ({ address }) => {
  const pageSize = 10;

  void api.public.transfers.list.prefetch({
    pagination: {
      page_size: pageSize,
      page: 0,
    },
    recipients: {
      include: [address],
    },
    timeframe: ActivityTimeframe.ThirtyDays,
    sorting: DEFAULT_TRANSFERS_SORTING,
  });

  return (
    <HydrateClient>
      <LatestTransactionsTableContainer>
        <Suspense fallback={<LoadingLatestTransactionsTable />}>
          <LatestTransactionsTable address={address} pageSize={pageSize} />
        </Suspense>
      </LatestTransactionsTableContainer>
    </HydrateClient>
  );
};

export const LoadingLatestTransactions = () => {
  return (
    <LatestTransactionsTableContainer>
      <LoadingLatestTransactionsTable />
    </LatestTransactionsTableContainer>
  );
};

const LoadingLatestTransactionsTable = () => {
  return <DataTableLoading columns={overviewColumns} rowCount={10} />;
};

const LatestTransactionsTableContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Section
      title="Latest Transactions"
      description="Latest x402 transactions to this server address"
      actions={<RangeSelector />}
    >
      {children}
    </Section>
  );
};
