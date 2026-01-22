'use client';

import { useState, useMemo, useCallback, useDeferredValue } from 'react';
import { Search } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { createColumns } from './columns';
import { api } from '@/trpc/client';

const PAGE_SIZE = 25;

export const McpUsersTable = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = api.admin.users.list.useQuery({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    ...(deferredSearch && { search: deferredSearch }),
  });

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(0);
    },
    []
  );

  const users = data ?? [];
  const hasNextPage = users.length === PAGE_SIZE;

  const columns = useMemo(() => createColumns(), []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by wallet address..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={users}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        hasNextPage={hasNextPage}
        getRowId={(row, index) => row?.recipientAddr ?? `loading-${index}`}
      />
    </div>
  );
};
