'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { api, type RouterOutputs } from '@/trpc/client';
import { ToolBreakdownModal } from '../tool-spending/breakdown-modal';
import { useWalletSpendingSorting } from '@/app/_contexts/sorting/wallet-spending/hook';

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
  const { data: freeTierWallet } =
    api.admin.freeTier.getWalletBalances.useQuery();
  const wallets = data?.items ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

  const columns = useMemo(
    () => createColumns(freeTierWallet?.address),
    [freeTierWallet?.address]
  );

  return (
    <div className="space-y-4">
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
