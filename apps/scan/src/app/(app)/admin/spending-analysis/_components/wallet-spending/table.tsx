'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { api, type RouterOutputs } from '@/trpc/client';
import { ToolBreakdownModal } from '../tool-spending/breakdown-modal';
import { useWalletSpendingSorting } from '@/app/(app)/_contexts/sorting/wallet-spending/hook';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type WalletSpending =
  RouterOutputs['admin']['spending']['byWallet']['items'][number];

type ModalState =
  | { type: 'none' }
  | { type: 'breakdown'; wallet: WalletSpending };

const PAGE_SIZE = 50;

export const WalletSpendingTable = () => {
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
  const [page, setPage] = useState(0);
  const { sorting } = useWalletSpendingSorting();

  const { data, isLoading } = api.admin.spending.byWallet.useQuery({
    pagination: {
      page: page,
      page_size: PAGE_SIZE,
    },
    sorting,
  });
  const { data: freeTierWallet } = api.admin.freeTier.address.useQuery();
  const wallets = data?.items ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

  const { refetch: fetchAccountsCsv, isFetching: isDownloading } =
    api.admin.spending.getServerAccountsCsv.useQuery(undefined, {
      enabled: false,
    });

  const handleDownloadCsv = async () => {
    const result = await fetchAccountsCsv();
    if (result.data) {
      const blob = new Blob([result.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `server-accounts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  const columns = useMemo(
    () => createColumns(freeTierWallet),
    [freeTierWallet]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => void handleDownloadCsv()}
          disabled={isDownloading}
          variant="outline"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? 'Downloading...' : 'Download Server Accounts CSV'}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={wallets}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        onRowClick={row =>
          setModalState({ type: 'breakdown', wallet: row.original })
        }
        page={page}
        onPageChange={setPage}
        hasNextPage={hasNextPage}
        getRowId={(row, index) => row?.walletId ?? `loading-${index}`}
      />

      {modalState.type === 'breakdown' && (
        <ToolBreakdownModal
          open={true}
          onOpenChange={open => !open && setModalState({ type: 'none' })}
          walletId={modalState.wallet.walletId}
          walletName={modalState.wallet.walletName}
        />
      )}
    </div>
  );
};
