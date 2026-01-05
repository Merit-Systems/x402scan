'use client';

import { useState, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type RefinementMode = 'none' | 'llm' | 'reranker' | 'both';
type QueryMode = 'keywords' | 'sql' | 'sql-parallel';

type SearchInputProps = {
  onSearch: (
    query: string,
    refinementMode: RefinementMode,
    queryMode: QueryMode
  ) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
};

const SearchInputComponent = ({
  onSearch,
  placeholder = "I'm looking for tools to search the web...",
  className,
  isLoading = false,
}: SearchInputProps) => {
  const [localQuery, setLocalQuery] = useState('');
  const [refinementMode, setRefinementMode] =
    useState<RefinementMode>('reranker');
  const [queryMode, setQueryMode] = useState<QueryMode>('sql');

  const handleSearch = () => {
    if (localQuery.trim()) {
      onSearch(localQuery, refinementMode, queryMode);
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-7 w-7" />
            <Input
              value={localQuery}
              onChange={e => setLocalQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder={placeholder}
              className="pl-14 h-21 text-2xl rounded-xl border-2 focus-visible:ring-4"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading || !localQuery.trim()}
            size="lg"
            className="h-21 px-8 text-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </Button>
        </div>
        <div className="pl-2 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Query Generation Mode</Label>
            <RadioGroup
              value={queryMode}
              onValueChange={value => setQueryMode(value as QueryMode)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="keywords" id="query-keywords" />
                <Label
                  htmlFor="query-keywords"
                  className="text-sm text-muted-foreground cursor-pointer font-normal"
                >
                  Keywords (LLM generates search terms)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sql" id="query-sql" />
                <Label
                  htmlFor="query-sql"
                  className="text-sm text-muted-foreground cursor-pointer font-normal"
                >
                  SQL (LLM generates full query)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sql-parallel" id="query-sql-parallel" />
                <Label
                  htmlFor="query-sql-parallel"
                  className="text-sm text-muted-foreground cursor-pointer font-normal"
                >
                  SQL Parallel (3x generations, combined results)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Refinement Mode</Label>
            <RadioGroup
              value={refinementMode}
              onValueChange={value =>
                setRefinementMode(value as RefinementMode)
              }
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="mode-none" />
                <Label
                  htmlFor="mode-none"
                  className="text-sm text-muted-foreground cursor-pointer font-normal"
                >
                  None (fastest)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="llm" id="mode-llm" />
                <Label
                  htmlFor="mode-llm"
                  className="text-sm text-muted-foreground cursor-pointer font-normal"
                >
                  LLM filtering
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reranker" id="mode-reranker" />
                <Label
                  htmlFor="mode-reranker"
                  className="text-sm text-muted-foreground cursor-pointer font-normal"
                >
                  Reranker
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="mode-both" />
                <Label
                  htmlFor="mode-both"
                  className="text-sm text-muted-foreground cursor-pointer font-normal"
                >
                  Both (most accurate, slowest)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
};

SearchInputComponent.displayName = 'SearchInput';

export const SearchInput = memo(SearchInputComponent);
