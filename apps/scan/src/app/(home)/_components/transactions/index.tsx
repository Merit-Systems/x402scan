import { DataTable } from '@/components/ui/data-table';

import { columns } from './columns';
import { Table } from './table';

interface Props {
  pageSize: number;
}

export const LatestTransactionsTable: React.FC<Props> = ({ pageSize }) => {
  return <Table pageSize={pageSize} />;
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
