"use client";

import { memo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Database, Code2, Loader2, Filter, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterQuestion } from "@/services/resource-search/types";

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
      className={cn(className, isLoading && "opacity-60 transition-opacity")}
    >
      <div className="space-y-3">
        <div className="type-supporting-body flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <Database className="size-4 text-muted-foreground" />
            )}
            <span>
              <span className="type-emphasis type-label text-foreground">
                {totalResults}
              </span>{" "}
              {totalResults === 1 ? "resource" : "resources"} found
            </span>
          </div>

          {explanation && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="">
                {explanation}
              </Badge>
            </div>
          )}

          {isLoading && (
            <Badge variant="default" className="">
              Searching...
            </Badge>
          )}
        </div>

        {filterQuestions && filterQuestions.length > 0 && (
          <Card className=" ">
            <div className="flex items-start gap-2">
              <Filter className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="type-emphasis mb-2 type-caption text-muted-foreground">
                  LLM Filter Questions:
                  {filterExplanation && (
                    <span className="ml-2 type-label text-muted-foreground/80">
                      ({filterExplanation})
                    </span>
                  )}
                </div>
                <ol className="list-inside list-decimal space-y-1.5">
                  {filterQuestions.map((fq) => (
                    <li
                      key={fq.index}
                      className="type-supporting-body text-foreground"
                    >
                      {fq.question}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Card>
        )}

        {keywords && keywords.length > 0 && (
          <Card className=" ">
            <div className="flex items-start gap-2">
              <Code2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="type-emphasis mb-2 type-caption text-muted-foreground">
                  Search Keywords:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {sqlCondition && (
          <Card className="">
            <Button
              type="button"
              variant="plain"
              size="surface"
              onClick={() => {
                setIsSqlExpanded(!isSqlExpanded);
              }}
              className="items-start"
            >
              <ChevronRight
                className={cn(
                  "text-primary mt-0.5 shrink-0 transition-transform size-4",
                  isSqlExpanded && "rotate-90"
                )}
              />
              <Database className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 text-left">
                <div className="type-emphasis type-caption text-muted-foreground">
                  SQL WHERE Clause
                </div>
              </div>
            </Button>
            {isSqlExpanded && (
              <div className="px-3 pb-3">
                <pre className="type-mono type-scale-caption overflow-x-auto rounded border bg-background/50 p-2 text-foreground">
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

SearchStatsComponent.displayName = "SearchStats";

export const SearchStats = memo(SearchStatsComponent);
