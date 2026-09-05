"use client";

import { useMemo, useState, useCallback, memo } from "react";

import { Badge } from "@/components/ui/badge";
import { LoadableDataTable } from "@/app/(app)/admin/_components/loadable-data-table";

import { ResourceExecutorModal } from "@/app/(app)/admin/_components/resource-executor-modal";

import { useResourceSearchSorting } from "@/app/(app)/admin/_contexts/sorting/resource-search/hook";

import { createColumns } from "./columns";

import type { FilteredSearchResult } from "@/services/resource-search/types";

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
        case "filterMatches": {
          const aPercent =
            a.filterAnswers.length > 0
              ? a.filterMatches / a.filterAnswers.length
              : 0;
          const bPercent =
            b.filterAnswers.length > 0
              ? b.filterMatches / b.filterAnswers.length
              : 0;
          comparison = aPercent - bPercent;
          break;
        }
        case "title": {
          const aTitle = a.origin.title ?? a.origin.origin;
          const bTitle = b.origin.title ?? b.origin.origin;
          comparison = aTitle.localeCompare(bTitle);
          break;
        }
      }

      return sorting.desc ? -comparison : comparison;
    });

    return sorted;
  }, [results, sorting]);

  const handleRowClick = useCallback((row: FilteredSearchResult) => {
    setSelectedResourceId(row.id);
  }, []);

  const handleModalClose = useCallback((open: boolean) => {
    if (!open) {
      setSelectedResourceId(null);
    }
  }, []);

  const getRowId = useCallback((row: FilteredSearchResult) => {
    return row.id;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="type-section-title">
            {results.length} {results.length === 1 ? "Result" : "Results"}
          </h3>
          {!isLoading && results.length > 0 && (
            <Badge variant="secondary">{results.length} resources</Badge>
          )}
        </div>
      </div>

      <LoadableDataTable
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

ResultsTableComponent.displayName = "ResultsTable";

export const ResultsTable = memo(ResultsTableComponent);
