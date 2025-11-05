'use client';

import { useMemo, useState, useCallback, memo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import type { FilteredSearchResult } from '@/services/resource-search/types';
import { ResourceExecutorModal } from '@/app/admin/tags/_components/resource-executor-modal';
import { createColumns } from './columns';
import type { Row } from '@tanstack/react-table';

interface ResultsTableProps {
  results: FilteredSearchResult[];
  isLoading?: boolean;
}

const ResultsTableComponent = ({
  results,
  isLoading = false,
}: ResultsTableProps) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const columns = useMemo(() => createColumns(), []);

  const handleRowClick = useCallback((row: Row<FilteredSearchResult>) => {
    setSelectedResourceId(row.original.id);
  }, []);

  const handleModalClose = useCallback((open: boolean) => {
    if (!open) {
      setSelectedResourceId(null);
    }
  }, []);

  const getRowId = useCallback((row: FilteredSearchResult, index: number) => {
    return row?.id ?? `loading-${index}`;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {results.length} {results.length === 1 ? 'Result' : 'Results'}
          </h3>
          {!isLoading && results.length > 0 && (
            <Badge variant="secondary">{results.length} resources</Badge>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={results}
        isLoading={isLoading}
        loadingRowCount={5}
        onRowClick={handleRowClick}
        getRowId={getRowId}
      />

      {selectedResourceId && (
        <ResourceExecutorModal
          open={true}
          onOpenChange={handleModalClose}
          resourceId={selectedResourceId}
        />
      )}
    </div>
  );
};

ResultsTableComponent.displayName = 'ResultsTable';

export const ResultsTable = memo(ResultsTableComponent);

