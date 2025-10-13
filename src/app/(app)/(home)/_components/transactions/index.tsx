import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { Table } from './table';

interface Props {
  limit: number;
  pageSize?: number;
}

export const LatestTransactionsTable: React.FC<Props> = ({
  limit,
  pageSize,
}) => {
  return <Table limit={limit} pageSize={pageSize} />;
};

export const LoadingLatestTransactionsTable = ({
  loadingRowCount = 10,
}: {
  loadingRowCount?: number;
}) => {
  return (
    <DataTable
      columns={columns}
      data={[]}
      loadingRowCount={loadingRowCount}
      isLoading
    />
  );
};
