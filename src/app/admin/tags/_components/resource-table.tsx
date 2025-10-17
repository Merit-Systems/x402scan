'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { api, type RouterOutputs } from '@/trpc/client';
import { EditTagModal } from './edit-tag-modal';

type Resource =
  RouterOutputs['resources']['list']['paginated']['items'][number];

const PAGE_SIZE = 25;

export const ResourceTable = () => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [page, setPage] = useState(0);

  const { data, isLoading } = api.resources.list.paginated.useQuery({
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const resources = data?.items ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

  return (
    <>
      <DataTable
        columns={columns}
        data={resources}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        onRowClick={row => setSelectedResource(row.original)}
        page={page}
        onPageChange={setPage}
        hasNextPage={hasNextPage}
      />

      {selectedResource && (
        <EditTagModal
          open={!!selectedResource}
          onOpenChange={open => !open && setSelectedResource(null)}
          resourceId={selectedResource.id}
          resourceName={selectedResource.resource}
          pagination={{
            skip: page * PAGE_SIZE,
            limit: PAGE_SIZE,
          }}
        />
      )}
    </>
  );
};
