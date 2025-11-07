'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createToolSpendingColumns } from './columns';
import { api, type RouterOutputs } from '@/trpc/client';
import { WalletBreakdownModal } from '../wallet-spending/breakdown-modal';
import { useToolSpendingSorting } from '@/app/_contexts/sorting/tool-spending/hook';

type ToolSpending = RouterOutputs['admin']['spending']['byTool'][number];

type ModalState = { type: 'none' } | { type: 'breakdown'; tool: ToolSpending };

export const ToolSpendingTable = () => {
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
  const { sorting } = useToolSpendingSorting();

  const { data, isLoading } = api.admin.spending.byTool.useQuery({ sorting });
  const tools = data ?? [];

  const columns = useMemo(() => createToolSpendingColumns(), []);

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={tools}
        pageSize={50}
        isLoading={isLoading}
        onRowClick={row =>
          setModalState({ type: 'breakdown', tool: row.original })
        }
        getRowId={(row, index) => row?.resourceId ?? `loading-${index}`}
      />

      {modalState.type === 'breakdown' && (
        <WalletBreakdownModal
          open={true}
          onOpenChange={open => !open && setModalState({ type: 'none' })}
          resourceId={modalState.tool.resourceId}
          resourceUrl={modalState.tool.resourceUrl}
        />
      )}
    </div>
  );
};
