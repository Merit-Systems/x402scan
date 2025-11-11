'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { createWalletBreakdownColumns } from './breakdown-columns';
import { ToolCallsChart } from './tool-calls-chart';
import { api } from '@/trpc/client';

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
  const { data, isLoading } = api.admin.spending.walletBreakdown.useQuery(
    { resourceId },
    { enabled: open }
  );
  const { data: freeTierWallet } = api.admin.freeTier.address.useQuery();

  const breakdown = data ?? [];
  const columns = useMemo(
    () => createWalletBreakdownColumns(freeTierWallet),
    [freeTierWallet]
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

        <div className="mt-4 space-y-4">
          <ToolCallsChart resourceId={resourceId} resourceUrl={resourceUrl} />

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
