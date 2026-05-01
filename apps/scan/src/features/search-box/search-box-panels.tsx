'use client';

import { Loader2 } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';

import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { getHostname, getPrimaryProtocol, getSuggestionKey } from './helpers';
import type { AutocompleteSuggestion, SearchPreviewResult } from './types';

const listScrollbarClassName =
  '[scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.18)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 hover:[&::-webkit-scrollbar-thumb]:bg-foreground/15';

function scrollRowIntoListView(row: HTMLElement) {
  const list = row.closest<HTMLElement>('[data-search-box-list]');
  if (!list) return;

  const listRect = list.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();
  const padding = 8;

  if (rowRect.top < listRect.top + padding) {
    list.scrollTop -= listRect.top + padding - rowRect.top;
  } else if (rowRect.bottom > listRect.bottom - padding) {
    list.scrollTop += rowRect.bottom - (listRect.bottom - padding);
  }
}

function useActiveRowScroll(activeIndex: number | null, scope: string) {
  useLayoutEffect(() => {
    if (activeIndex === null) return;

    const row = document.querySelector<HTMLElement>(
      `[data-search-active-row="${scope}"]`
    );
    if (!row) return;

    scrollRowIntoListView(row);
  }, [activeIndex, scope]);
}

function FaviconBadge({ favicon }: { favicon: string }) {
  const src = favicon.trim();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={14}
      height={14}
      loading="lazy"
      decoding="async"
      className="size-3.5 shrink-0 rounded-sm object-cover"
      onError={() => setFailedSrc(src)}
    />
  );
}

function OriginMeta({
  favicon,
  originUrl,
  originTitle,
}: {
  favicon: string;
  originUrl: string;
  originTitle: string;
}) {
  return (
    <span className="flex min-w-[5.5rem] max-w-[7rem] items-center justify-end gap-1.5 text-[11px] text-muted-foreground/80 md:min-w-[8.5rem] md:max-w-[10rem] md:text-xs">
      <FaviconBadge favicon={favicon} />
      <span className="truncate">{originTitle || getHostname(originUrl)}</span>
    </span>
  );
}

function SuggestionText({
  suggestion,
  query,
}: {
  suggestion: string;
  query: string;
}) {
  const trimmedQuery = query.trim();
  const matchIndex = suggestion
    .toLowerCase()
    .indexOf(trimmedQuery.toLowerCase());

  if (!trimmedQuery || matchIndex === -1) {
    return <span>{suggestion}</span>;
  }

  const start = suggestion.slice(0, matchIndex);
  const match = suggestion.slice(matchIndex, matchIndex + trimmedQuery.length);
  const end = suggestion.slice(matchIndex + trimmedQuery.length);

  return (
    <span>
      <span className="text-foreground">{start}</span>
      <span className="font-medium text-foreground">{match}</span>
      <span className="text-muted-foreground">{end}</span>
    </span>
  );
}

function ResultSummary({ result }: { result: SearchPreviewResult }) {
  const primaryProtocol = getPrimaryProtocol(result.protocols);

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3 md:gap-4">
        <div className="truncate text-sm font-medium md:text-[15px]">
          {result.title}
        </div>
        <OriginMeta
          favicon={result.favicon}
          originTitle={result.originTitle}
          originUrl={result.originUrl}
        />
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono uppercase tracking-[0.12em] text-foreground/80">
          {result.method}
        </span>
        <span className="truncate font-mono">{result.path}</span>
        {primaryProtocol ? (
          <span className="shrink-0 uppercase tracking-[0.12em]">
            {primaryProtocol}
          </span>
        ) : null}
        {result.price ? (
          <span className="shrink-0 truncate">{result.price}</span>
        ) : result.authMode ? (
          <span className="shrink-0 uppercase tracking-[0.12em]">
            {result.authMode}
          </span>
        ) : null}
      </div>
      {result.facets.length > 0 ? (
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {result.facets.join(' • ')}
        </p>
      ) : null}
    </div>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="px-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-3/5 rounded-sm md:w-1/2" />
          <Skeleton className="h-3 w-20 shrink-0 rounded-sm" />
        </div>
        <Skeleton className="mt-1 h-3 w-44 rounded-sm md:w-64" />
      </div>
    </div>
  );
}

export function SearchResultsPanel({
  results,
  loading,
  requestError,
  selectedResultIndex,
  emptyMessage,
  onSelectResult,
}: {
  results: SearchPreviewResult[];
  loading: boolean;
  requestError: boolean;
  selectedResultIndex: number | null;
  emptyMessage: string;
  onSelectResult: (result: SearchPreviewResult, index: number) => void;
}) {
  useActiveRowScroll(selectedResultIndex, 'results');

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 text-left dark:border-white/10">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Results
        </div>
      </div>

      <CommandList
        data-search-box-list="true"
        className={`max-h-[min(22rem,50dvh)] pb-2 md:max-h-[360px] ${listScrollbarClassName}`}
        gradientClassName="from-card"
      >
        {loading ? (
          <CommandGroup className="p-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <SearchResultSkeleton key={index} />
            ))}
          </CommandGroup>
        ) : requestError ? (
          <CommandGroup className="p-2">
            <div className="px-4 py-4 text-sm text-muted-foreground">
              Search results are temporarily unavailable.
            </div>
          </CommandGroup>
        ) : results.length > 0 ? (
          <CommandGroup className="p-2">
            {results.map((result, index) => (
              <CommandItem
                key={`result:${result.resourceId}`}
                value={`result:${result.resourceId}`}
                onSelect={() => onSelectResult(result, index)}
                data-active={selectedResultIndex === index ? 'true' : undefined}
                data-search-active-row={
                  selectedResultIndex === index ? 'results' : undefined
                }
                className="cursor-pointer rounded-md px-3 py-3 transition-colors hover:bg-accent/70 hover:text-accent-foreground data-[selected=true]:bg-transparent data-[selected=true]:text-foreground data-[active=true]:!bg-accent data-[active=true]:!text-accent-foreground"
              >
                <ResultSummary result={result} />
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <CommandEmpty>{emptyMessage}</CommandEmpty>
        )}
      </CommandList>
    </>
  );
}

export function SearchSuggestionsPanel({
  query,
  suggestions,
  loading,
  requestError,
  selectedSuggestionIndex,
  onSelectSuggestion,
}: {
  query: string;
  suggestions: AutocompleteSuggestion[];
  loading: boolean;
  requestError: boolean;
  selectedSuggestionIndex: number | null;
  onSelectSuggestion: (index: number) => void;
}) {
  useActiveRowScroll(selectedSuggestionIndex, 'suggestions');

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 text-left dark:border-white/10">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Suggestions
        </div>
      </div>

      <CommandList
        data-search-box-list="true"
        className={`max-h-[min(20rem,50dvh)] pb-2 pt-2 md:max-h-[320px] ${listScrollbarClassName}`}
        gradientClassName="from-card"
      >
        {suggestions.length > 0 ? (
          <CommandGroup className="p-2">
            {suggestions.map((suggestion, index) => (
              <CommandItem
                key={getSuggestionKey(suggestion)}
                value={getSuggestionKey(suggestion)}
                onSelect={() => onSelectSuggestion(index)}
                data-active={
                  selectedSuggestionIndex === index ? 'true' : undefined
                }
                data-search-active-row={
                  selectedSuggestionIndex === index ? 'suggestions' : undefined
                }
                className={cn(
                  'cursor-pointer rounded-md px-3 py-2.5 text-sm leading-tight transition-colors hover:bg-accent/70 hover:text-accent-foreground md:text-[15px] data-[selected=true]:bg-transparent data-[selected=true]:text-foreground data-[active=true]:!bg-accent data-[active=true]:!text-accent-foreground'
                )}
              >
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 md:gap-4">
                  <SuggestionText suggestion={suggestion.text} query={query} />
                  <OriginMeta
                    favicon={suggestion.favicon}
                    originTitle={suggestion.originTitle}
                    originUrl={suggestion.originUrl}
                  />
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {loading && suggestions.length === 0 ? (
          <CommandGroup className="p-2">
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching suggestions…
            </div>
          </CommandGroup>
        ) : null}

        {!loading && suggestions.length === 0 && !requestError ? (
          <CommandEmpty>No matching suggestions yet.</CommandEmpty>
        ) : null}

        {requestError ? (
          <CommandGroup className="p-2">
            <div className="px-4 py-4 text-sm text-muted-foreground">
              Autocomplete is temporarily unavailable.
            </div>
          </CommandGroup>
        ) : null}
      </CommandList>
    </>
  );
}
