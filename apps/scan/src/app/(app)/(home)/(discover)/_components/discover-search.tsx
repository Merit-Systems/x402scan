'use client';

import { CornerDownLeft, Loader2, Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { api } from '@/trpc/client';
import { useSellersSorting } from '@/app/(app)/_contexts/sorting/sellers/hook';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { useChain } from '@/app/(app)/_contexts/chain/hook';

import { DataTable } from '@/components/ui/data-table';
import { discoverColumns } from './columns';
import { useDiscoverSearch } from './discover-search-context';

/**
 * Inline search input — rendered in the heading.
 */
export const DiscoverSearchInput = () => {
  const { input, setInput, isSearching, submit, clear } = useDiscoverSearch();

  return (
    <div className="relative w-full md:flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape' && isSearching) {
            e.preventDefault();
            clear();
          }
        }}
        placeholder='Describe what you need — e.g. "send an email", "generate an image"...'
        className="pl-9 pr-9 h-11 bg-transparent"
        autoComplete="off"
        name="discover-search"
        type="text"
      />
      {isSearching && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={clear}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
};

/**
 * Submit button — rendered next to the search input.
 */
export const DiscoverSearchSubmit = () => {
  const { input, isDirty, submit } = useDiscoverSearch();
  const hasInput = input.trim().length > 0;

  if (!hasInput) {
    return (
      <Button
        size="lg"
        variant="outline"
        className="shrink-0 w-full md:w-fit px-4 h-11 hidden md:flex"
        asChild
      >
        <a href="/resources/register">
          Register Resource
        </a>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="shrink-0 w-full md:w-fit px-4 h-11"
      onClick={submit}
      disabled={!isDirty}
    >
      <Search className="size-4" />
      Search
      <CornerDownLeft className="hidden md:block size-3 ml-1 opacity-50" />
    </Button>
  );
};

/**
 * Search results table — rendered in the body when searching.
 */
export const DiscoverSearchResults = () => {
  const { query } = useDiscoverSearch();
  const { sorting } = useSellersSorting();
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();

  const { data: searchResults, isLoading: isSearchLoading } =
    api.public.discover.search.useQuery(
      { query },
      { enabled: query.length > 0 }
    );

  const searchOriginUrls = searchResults?.map(r => r.origin) ?? [];

  const { data: sellers, isLoading: isSellersLoading } =
    api.public.sellers.bazaar.list.useQuery(
      {
        chain,
        pagination: { page_size: 100 },
        timeframe,
        sorting,
        originUrls: searchOriginUrls,
      },
      { enabled: searchOriginUrls.length > 0 }
    );

  const isLoading = isSearchLoading || isSellersLoading;
  const hasQuery = query.length > 0;
  const hasResults =
    hasQuery && !isLoading && (sellers?.items?.length ?? 0) > 0;
  const noResults =
    hasQuery && !isLoading && (sellers?.items?.length ?? 0) === 0;

  if (!hasQuery) return null;

  // Phase 1: LLM is thinking
  if (isSearchLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
        <p className="text-sm text-muted-foreground">
          Finding the best APIs for &quot;{query}&quot;...
        </p>
      </div>
    );
  }

  // Phase 2: Got search results, loading usage data
  if (isSellersLoading) {
    return (
      <DataTable
        columns={discoverColumns}
        data={[]}
        loadingRowCount={searchOriginUrls.length || 5}
        isLoading
      />
    );
  }

  if (hasResults) {
    return (
      <DataTable
        columns={discoverColumns}
        data={sellers!.items}
        pageSize={10}
      />
    );
  }

  if (noResults) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No results found. Try a different description.
      </p>
    );
  }

  return null;
};
