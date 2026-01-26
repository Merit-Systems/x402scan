'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { useDebounce } from '@/hooks/use-debounce';

const PAGE_SIZE = 25;

type StatusFilter = 'ALL' | 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED' | 'DISABLED';
type OrderBy = 'createdAt' | 'status';

export const InviteCodesTable = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [orderBy, setOrderBy] = useState<OrderBy>('createdAt');
  const debouncedSearch = useDebounce(search, 300);
  const utils = api.useUtils();

  const { data, isLoading } = api.admin.inviteCodes.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    orderBy,
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

  // Reset to first page when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleStatusFilterChange = useCallback((value: StatusFilter) => {
    setStatusFilter(value);
    setPage(0);
  }, []);

  const handleOrderByChange = useCallback((value: OrderBy) => {
    setOrderBy(value);
    setPage(0);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by code or note..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="EXHAUSTED">Exhausted</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="DISABLED">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orderBy} onValueChange={handleOrderByChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Order by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created Date</SelectItem>
            <SelectItem value="status">Status</SelectItem>
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
