'use client';

import { memo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Database, Code2, Loader2, Filter, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FilterQuestion } from '@/services/resource-search/types';

interface SearchStatsProps {
  totalResults: number;
  sqlCondition?: string;
  keywords?: string[];
  explanation?: string;
  filterQuestions?: FilterQuestion[];
  filterExplanation?: string;
  className?: string;
  isLoading?: boolean;
}

const SearchStatsComponent = ({
  totalResults,
  sqlCondition,
  keywords,
  explanation,
  filterQuestions,
  filterExplanation,
  className,
  isLoading = false,
}: SearchStatsProps) => {
  const [isSqlExpanded, setIsSqlExpanded] = useState(false);

  return (
    <div
      className={cn(className, isLoading && 'opacity-60 transition-opacity')}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <Database className="h-4 w-4 text-muted-foreground" />
            )}
            <span>
              <span className="font-semibold text-foreground">
                {totalResults}
              </span>{' '}
              {totalResults === 1 ? 'resource' : 'resources'} found
            </span>
          </div>

          {explanation && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {explanation}
              </Badge>
            </div>
          )}

          {isLoading && (
            <Badge variant="default" className="text-xs">
              Searching...
            </Badge>
          )}
        </div>

        {filterQuestions && filterQuestions.length > 0 && (
          <Card className="p-3 bg-muted/50">
            <div className="flex items-start gap-2">
              <Filter className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  LLM Filter Questions:
                  {filterExplanation && (
                    <span className="ml-2 font-normal text-muted-foreground/80">
                      ({filterExplanation})
                    </span>
                  )}
                </div>
                <ol className="space-y-1.5 list-decimal list-inside">
                  {filterQuestions.map(fq => (
                    <li key={fq.index} className="text-xs text-foreground">
                      {fq.question}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Card>
        )}

        {keywords && keywords.length > 0 && (
          <Card className="p-3 bg-muted/50">
            <div className="flex items-start gap-2">
              <Code2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Search Keywords:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {sqlCondition && (
          <Card className="bg-muted/50">
            <button
              onClick={() => setIsSqlExpanded(!isSqlExpanded)}
              className="w-full p-3 flex items-start gap-2 hover:bg-muted/70 transition-colors"
            >
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-primary mt-0.5 flex-shrink-0 transition-transform',
                  isSqlExpanded && 'rotate-90'
                )}
              />
              <Database className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-medium text-muted-foreground">
                  SQL WHERE Clause
                </div>
              </div>
            </button>
            {isSqlExpanded && (
              <div className="px-3 pb-3">
                <pre className="text-xs text-foreground font-mono bg-background/50 p-2 rounded border overflow-x-auto">
                  {sqlCondition}
                </pre>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

SearchStatsComponent.displayName = 'SearchStats';

export const SearchStats = memo(SearchStatsComponent);
