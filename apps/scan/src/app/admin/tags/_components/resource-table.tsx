'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { api, type RouterOutputs } from '@/trpc/client';
import { EditTagModal } from './edit-tag-modal';
import { ResourceExecutorModal } from './resource-executor-modal';
import { ControlMenu } from './control-menu';
import { TagFilter } from './tag-filter';
import type { RowSelectionState } from '@tanstack/react-table';

type Resource =
  RouterOutputs['public']['resources']['list']['paginated']['items'][number];

const PAGE_SIZE = 25;

type ModalState =
  | { type: 'none' }
  | { type: 'tags'; resource: Resource }
  | { type: 'executor'; resource: Resource };

export const ResourceTable = () => {
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
  const [page, setPage] = useState(0);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data, isLoading } = api.public.resources.list.paginated.useQuery({
    pagination: {
      page: page,
      page_size: PAGE_SIZE,
    },
    where:
      selectedTagIds.length > 0
        ? {
            tags: {
              some: {
                tagId: {
                  in: selectedTagIds,
                },
              },
            },
          }
        : undefined,
  });
  const resources = data?.items ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

  const selectedResources = Object.keys(rowSelection)
    .filter(key => rowSelection[key])
    .map(id => resources.find((r: Resource) => r.id === id))
    .filter(Boolean) as Resource[];

  const columns = useMemo(
    () =>
      createColumns({
        onTagsClick: resource => setModalState({ type: 'tags', resource }),
      }),
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <TagFilter
          selectedTagIds={selectedTagIds}
          onSelectedTagIdsChange={setSelectedTagIds}
        />
        <ControlMenu
          selectedResources={selectedResources}
          onSuccess={() => setRowSelection({})}
        />
      </div>

      <DataTable
        columns={columns}
        data={resources}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        onRowClick={row =>
          setModalState({ type: 'executor', resource: row.original })
        }
        page={page}
        onPageChange={setPage}
        hasNextPage={hasNextPage}
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row, index) => row?.id ?? `loading-${index}`}
      />

      {modalState.type === 'tags' && (
        <EditTagModal
          open={true}
          onOpenChange={open => !open && setModalState({ type: 'none' })}
          resourceId={modalState.resource.id}
          resourceName={modalState.resource.resource}
          pagination={{
            page: page,
            page_size: PAGE_SIZE,
          }}
          selectedTagIds={selectedTagIds}
          setSelectedTagIds={setSelectedTagIds}
        />
      )}

      {modalState.type === 'executor' && (
        <ResourceExecutorModal
          open={true}
          onOpenChange={open => !open && setModalState({ type: 'none' })}
          resourceId={modalState.resource.id}
        />
      )}
    </div>
  );
};
