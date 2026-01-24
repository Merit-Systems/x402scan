'use client';

import { useState, useMemo, useCallback, useDeferredValue } from 'react';
import { Search } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createColumns } from './columns';
import { api } from '@/trpc/client';

const PAGE_SIZE = 25;

type StatusFilter = 'ALL' | 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED' | 'DISABLED';

export const InviteCodesTable = () => {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const utils = api.useUtils();

  const { data, isLoading } = api.admin.inviteCodes.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
    ...(deferredSearch && { search: deferredSearch }),
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

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value as StatusFilter);
    setPage(0);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(0);
    },
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or creator..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="EXHAUSTED">Exhausted</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="DISABLED">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
