'use client';

import { useState, useMemo } from 'react';
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

  const inviteCodes = data ?? [];
  const hasNextPage = inviteCodes.length === PAGE_SIZE;

  const columns = useMemo(
    () =>
      createColumns({
        onDisable: id => disableMutation.mutate({ id }),
        onReactivate: id => reactivateMutation.mutate({ id }),
      }),
    [disableMutation, reactivateMutation]
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
