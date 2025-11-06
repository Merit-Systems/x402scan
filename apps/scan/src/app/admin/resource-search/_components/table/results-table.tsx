'use client';

import { useMemo, useState, useCallback, memo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import type { FilteredSearchResult } from '@/services/resource-search/types';
import { ResourceExecutorModal } from '@/app/admin/tags/_components/resource-executor-modal';
import { createColumns } from './columns';
import type { Row } from '@tanstack/react-table';
import { useResourceSearchSorting } from '@/app/_contexts/sorting/resource-search/hook';

interface ResultsTableProps {
  results: FilteredSearchResult[];
  isLoading?: boolean;
}

const ResultsTableComponent = ({
  results,
  isLoading = false,
}: ResultsTableProps) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null
  );
  const { sorting } = useResourceSearchSorting();
  const columns = useMemo(() => createColumns(), []);

  const sortedResults = useMemo(() => {
    const sorted = [...results];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sorting.id) {
        case 'filterMatches': {
          const aPercent = a.filterAnswers.length > 0 
            ? a.filterMatches / a.filterAnswers.length 
            : 0;
          const bPercent = b.filterAnswers.length > 0 
            ? b.filterMatches / b.filterAnswers.length 
            : 0;
          comparison = aPercent - bPercent;
          break;
        }
        case 'title': {
          const aTitle = a.origin.title ?? a.origin.origin;
          const bTitle = b.origin.title ?? b.origin.origin;
          comparison = aTitle.localeCompare(bTitle);
          break;
        }
        case 'usage': {
          const aCalls = a.analytics?.totalCalls ?? 0;
          const bCalls = b.analytics?.totalCalls ?? 0;
          comparison = aCalls - bCalls;
          break;
        }
        case 'performance': {
          const aRate = a.analytics?.successRate ?? 0;
          const bRate = b.analytics?.successRate ?? 0;
          comparison = aRate - bRate;
          break;
        }
      }
      
      return sorting.desc ? -comparison : comparison;
    });
    
    return sorted;
  }, [results, sorting]);

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
        data={sortedResults}
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
