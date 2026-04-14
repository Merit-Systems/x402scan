'use client';

import { CornerDownLeft, Plus, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChain } from '@/app/(app)/_contexts/chain/hook';
import { useSellersSorting } from '@/app/(app)/_contexts/sorting/sellers/hook';
import { api } from '@/trpc/client';

import { DataTable } from '@/components/ui/data-table';
import { discoverColumns } from './columns';
import { useDiscoverSearch } from './discover-search-context';
import { ActivityTimeframe } from '@/types/timeframes';


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
        placeholder='Search any agent capability. e.g. "send an email", "generate an image", "search the web", "buy a mug"...'
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
        <a href="/resources/register">Register Resource</a>
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
  const { chain } = useChain();

  const { data: searchResults, isLoading: isSearchLoading } =
    api.public.discover.search.useQuery(
      { query },
      { enabled: query.length > 0 }
    );

  const x402Results =
    searchResults?.filter(r => r.protocols.includes('x402')) ?? [];
  const x402OriginUrls = x402Results.map(r => r.origin);

  const { data: sellers, isLoading: isSellersLoading } =
    api.public.sellers.bazaar.list.useQuery(
      {
        chain,
        pagination: { page_size: 100 },
        timeframe: ActivityTimeframe.AllTime,
        sorting,
        originUrls: x402OriginUrls,
      },
      { enabled: x402OriginUrls.length > 0 }
    );

  const hasQuery = query.length > 0;

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
          Finding the best x402 resources for &quot;{query}&quot;...
        </p>
      </div>
    );
  }

  // No x402 results
  if (x402Results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm text-muted-foreground">
          No x402 results found. Try a different description.
        </p>
        <Button variant="outline" size="lg" asChild>
          <a href="/resources/register">
            <Plus className="size-4" />
            Register Resource
          </a>
        </Button>
      </div>
    );
  }

  // Phase 2: Loading usage data
  if (isSellersLoading) {
    return (
      <DataTable
        columns={discoverColumns}
        data={[]}
        loadingRowCount={x402OriginUrls.length}
        isLoading
      />
    );
  }

  // Build endpoint lookup from search results
  const endpointByOrigin = new Map(
    x402Results
      .filter(r => r.endpoint)
      .map(r => [r.origin, r.endpoint!])
  );

  // Build merged table data: bazaar items + stub rows for unbooked origins
  const bazaarItems = sellers?.items ?? [];
  const bazaarOrigins = new Set(
    bazaarItems.flatMap(item => item.origins.map(o => o.origin))
  );

  const enrichedBazaarItems = bazaarItems.map(item => ({
    ...item,
    searchEndpoint: endpointByOrigin.get(item.origins[0]?.origin ?? ''),
  }));

  const stubItems = x402Results
    .filter(r => !bazaarOrigins.has(r.origin))
    .map(r => ({
      recipients: [],
      origins: [
        {
          id: r.origin,
          origin: r.origin,
          title: r.title,
          description: r.description,
          favicon: r.favicon,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      facilitators: [],
      tx_count: 0,
      total_amount: 0,
      latest_block_timestamp: null,
      unique_buyers: 0,
      chains: [],
      searchEndpoint: r.endpoint,
    }));

  const allItemsUnsorted = [...enrichedBazaarItems, ...stubItems];

  // Preserve LLM relevance order by default, let table sorting override
  const searchOrder = new Map(x402OriginUrls.map((url, i) => [url, i]));
  const allItems = allItemsUnsorted.sort((a, b) => {
    const aOrigin = a.origins[0]?.origin ?? '';
    const bOrigin = b.origins[0]?.origin ?? '';
    return (searchOrder.get(aOrigin) ?? Infinity) - (searchOrder.get(bOrigin) ?? Infinity);
  });

  return (
    <DataTable columns={discoverColumns} data={allItems} pageSize={10} />
  );
};
