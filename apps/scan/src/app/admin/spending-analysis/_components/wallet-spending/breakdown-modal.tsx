'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { createWalletBreakdownColumns } from './breakdown-columns';
import { api } from '@/trpc/client';
import type { WalletBreakdownSortId } from '@/services/db/spending/by-tool';

interface WalletBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceUrl: string;
}

export const WalletBreakdownModal = ({
  open,
  onOpenChange,
  resourceId,
  resourceUrl,
}: WalletBreakdownModalProps) => {
  const [sorting, setSorting] = useState<{
    id: WalletBreakdownSortId;
    desc: boolean;
  }>({
    id: 'totalMaxAmount',
    desc: true,
  });

  const { data, isLoading } = api.admin.spending.walletBreakdown.useQuery(
    { resourceId, sorting },
    { enabled: open }
  );
  const { data: freeTierWallet } =
    api.admin.freeTier.getWalletBalances.useQuery();

  const breakdown = data ?? [];
  const columns = useMemo(
    () =>
      createWalletBreakdownColumns(
        sorting,
        setSorting,
        freeTierWallet?.address
      ),
    [sorting, freeTierWallet?.address]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono break-all">
            Wallet Breakdown - {resourceUrl}
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of wallets using this tool
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={breakdown}
            pageSize={20}
            isLoading={isLoading}
            getRowId={(row, index) => row?.walletId ?? `loading-${index}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
