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
import { Copyable } from '@/components/ui/copyable';
import { createToolBreakdownColumns } from './breakdown-columns';
import { api } from '@/trpc/client';

type ToolBreakdownModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  walletName: string;
};

export const ToolBreakdownModal = ({
  open,
  onOpenChange,
  walletId,
  walletName,
}: ToolBreakdownModalProps) => {
  const { data, isLoading } = api.admin.spending.toolBreakdown.useQuery(
    { walletId },
    { enabled: open }
  );
  const { data: freeTierWallet } = api.admin.freeTier.address.useQuery();

  const breakdown = data ?? [];
  const columns = useMemo(() => createToolBreakdownColumns(), []);

  const isFreeTier =
    freeTierWallet && walletName.toLowerCase() === freeTierWallet.toLowerCase();
  const displayName = isFreeTier ? `Free Tier - ${walletName}` : walletName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono break-all">
            Tool Breakdown -{' '}
            <Copyable value={walletName} toastMessage="Wallet address copied">
              {displayName}
            </Copyable>
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of tool usage and spending for this wallet
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={breakdown}
            pageSize={10}
            isLoading={isLoading}
            getRowId={(row, index) => row?.resourceId ?? `loading-${index}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
