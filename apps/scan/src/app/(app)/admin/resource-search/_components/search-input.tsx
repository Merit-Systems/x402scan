"use client";

import { useState, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import z from "zod";

const refinementModeSchema = z.enum(["none", "llm", "reranker", "both"]);
const queryModeSchema = z.enum(["keywords", "sql", "sql-parallel"]);

type RefinementMode = z.infer<typeof refinementModeSchema>;
type QueryMode = z.infer<typeof queryModeSchema>;

interface SearchInputProps {
  onSearch: (
    query: string,
    refinementMode: RefinementMode,
    queryMode: QueryMode
  ) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
}

const SearchInputComponent = ({
  onSearch,
  placeholder = "I'm looking for tools to search the web...",
  className,
  isLoading = false,
}: SearchInputProps) => {
  const [localQuery, setLocalQuery] = useState("");
  const [refinementMode, setRefinementMode] =
    useState<RefinementMode>("reranker");
  const [queryMode, setQueryMode] = useState<QueryMode>("sql");

  const handleSearch = () => {
    if (localQuery.trim()) {
      onSearch(localQuery, refinementMode, queryMode);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 size-7 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder={placeholder}
              className=" "
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading || !localQuery.trim()}
            size="lg"
            className=" "
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>
        <div className="space-y-6 pl-2">
          <div className="space-y-3">
            <Label className=" ">Query Generation Mode</Label>
            <RadioGroup
              value={queryMode}
              onValueChange={(value) => {
                const parsed = queryModeSchema.safeParse(value);
                if (parsed.success) setQueryMode(parsed.data);
              }}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="keywords" id="query-keywords" />
                <Label htmlFor="query-keywords" className="cursor-pointer">
                  Keywords (LLM generates search terms)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sql" id="query-sql" />
                <Label htmlFor="query-sql" className="cursor-pointer">
                  SQL (LLM generates full query)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sql-parallel" id="query-sql-parallel" />
                <Label htmlFor="query-sql-parallel" className="cursor-pointer">
                  SQL Parallel (3x generations, combined results)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className=" ">Refinement Mode</Label>
            <RadioGroup
              value={refinementMode}
              onValueChange={(value) => {
                const parsed = refinementModeSchema.safeParse(value);
                if (parsed.success) setRefinementMode(parsed.data);
              }}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="mode-none" />
                <Label htmlFor="mode-none" className="cursor-pointer">
                  None (fastest)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="llm" id="mode-llm" />
                <Label htmlFor="mode-llm" className="cursor-pointer">
                  LLM filtering
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="reranker" id="mode-reranker" />
                <Label htmlFor="mode-reranker" className="cursor-pointer">
                  Reranker
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="mode-both" />
                <Label htmlFor="mode-both" className="cursor-pointer">
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

SearchInputComponent.displayName = "SearchInput";

export const SearchInput = memo(SearchInputComponent);
