'use client';

import { useState, useCallback } from 'react';
import { SearchInput } from './search-input';
import { ResultsTable } from './table/results-table';
import { SearchStats } from './search-stats';
import { Card } from '@/components/ui/card';
import { api } from '@/trpc/client';
import { ResourceSearchSortingProvider } from '@/app/(app)/_contexts/sorting/resource-search/provider';
import { defaultResourceSearchSorting } from '@/app/(app)/_contexts/sorting/resource-search/default';

type RefinementMode = 'none' | 'llm' | 'reranker' | 'both';
type QueryMode = 'keywords' | 'sql' | 'sql-parallel';

export const SearchContainer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refinementMode, setRefinementMode] = useState<RefinementMode>('none');
  const [queryMode, setQueryMode] = useState<QueryMode>('keywords');
  const [searchKey, setSearchKey] = useState(0);

  const { data, isLoading } = api.admin.resources.search.useQuery(
    { query: searchQuery, refinementMode, queryMode },
    {
      enabled: !!searchQuery.trim(),
    }
  );

  const handleSearch = useCallback(
    (query: string, refinement: RefinementMode, qMode: QueryMode) => {
      if (query.trim()) {
        setSearchQuery(query);
        setRefinementMode(refinement);
        setQueryMode(qMode);
        setSearchKey(prev => prev + 1);
      }
    },
    []
  );

  const hasResults = !!searchQuery.trim();

  return (
    <div className="space-y-8">
      <Card className="p-12">
        <SearchInput
          onSearch={handleSearch}
          isLoading={isLoading}
          className="max-w-4xl mx-auto"
        />
      </Card>

      {hasResults && (
        <div className="space-y-6" key={searchKey}>
          <SearchStats
            totalResults={data?.totalCount ?? 0}
            sqlCondition={data?.sqlCondition}
            keywords={data?.keywords}
            explanation={data?.explanation}
            filterQuestions={data?.filterQuestions}
            filterExplanation={data?.filterExplanation}
            isLoading={isLoading}
          />

          <Card className="p-8">
            <ResourceSearchSortingProvider
              initialSorting={defaultResourceSearchSorting}
            >
              <ResultsTable
                results={data?.results ?? []}
                isLoading={isLoading}
              />
            </ResourceSearchSortingProvider>
          </Card>
        </div>
      )}
    </div>
  );
};
