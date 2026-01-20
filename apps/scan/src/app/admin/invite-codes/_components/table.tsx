'use client';

import { useState, useMemo, useCallback } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { api } from '@/trpc/client';

const PAGE_SIZE = 25;

export const InviteCodesTable = () => {
  const [page, setPage] = useState(0);
  const utils = api.useUtils();

  const { data, isLoading } = api.admin.inviteCodes.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const disableMutation = api.admin.inviteCodes.disable.useMutation({
    onSuccess: () => {
      void utils.admin.inviteCodes.list.invalidate();
    },
  });

  const reactivateMutation = api.admin.inviteCodes.reactivate.useMutation({
    onSuccess: () => {
      void utils.admin.inviteCodes.list.invalidate();
    },
  });

  const updateMaxRedemptionsMutation =
    api.admin.inviteCodes.updateMaxRedemptions.useMutation({
      onSuccess: () => {
        void utils.admin.inviteCodes.list.invalidate();
      },
    });

  const handleEditMaxRedemptions = useCallback(
    (id: string, currentMax: number) => {
      const input = window.prompt(
        `Enter new max redemptions (0 for unlimited):`,
        String(currentMax)
      );
      if (input === null) return;
      const newMax = parseInt(input, 10);
      if (isNaN(newMax) || newMax < 0) {
        alert('Please enter a valid non-negative number');
        return;
      }
      updateMaxRedemptionsMutation.mutate({ id, maxRedemptions: newMax });
    },
    [updateMaxRedemptionsMutation]
  );

  const inviteCodes = data ?? [];
  const hasNextPage = inviteCodes.length === PAGE_SIZE;

  const columns = useMemo(
    () =>
      createColumns({
        onDisable: id => disableMutation.mutate({ id }),
        onReactivate: id => reactivateMutation.mutate({ id }),
        onEditMaxRedemptions: handleEditMaxRedemptions,
      }),
    [disableMutation, reactivateMutation, handleEditMaxRedemptions]
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={inviteCodes}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        hasNextPage={hasNextPage}
        getRowId={(row, index) => row?.id ?? `loading-${index}`}
      />
    </div>
  );
};
