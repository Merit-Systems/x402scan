'use client';

import { CornerDownLeft, Loader2, Plus, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChain } from '@/app/(app)/_contexts/chain/hook';
import { useSellersSorting } from '@/app/(app)/_contexts/sorting/sellers/hook';
import { api } from '@/trpc/client';
import { Origin } from '@/app/(app)/_components/origins';
import { Resource } from '@/app/(app)/_components/resource';
import { Favicon } from '@/app/(app)/_components/favicon';

import { DataTable } from '@/components/ui/data-table';
import { discoverColumns } from './columns';
import { useDiscoverSearch } from './discover-search-context';
import { ActivityTimeframe } from '@/types/timeframes';

/**
 * Inline search input — rendered in the heading. Shows live suggestions:
 * keyword origin/resource matches before a space is typed, semantic search
 * once the query becomes a sentence.
 */
export const DiscoverSearchInput = () => {
  const { input, setInput, isSearching, submit, clear } = useDiscoverSearch();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className="relative w-full md:flex-1"
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
      onFocus={() => setIsFocused(true)}
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
          onClick={clear}
        >
          <X className="size-4" />
        </button>
      )}
      <DiscoverInlineSuggestions enabled={isFocused} />
    </div>
  );
};

/**
 * Live dropdown shown beneath the discover search input. Pre-space we hit the
 * same origin/resource search the navbar uses; once the user types a space
 * (signaling a phrase) we swap to the semantic search endpoint.
 */
const DiscoverInlineSuggestions: React.FC<{ enabled: boolean }> = ({
  enabled,
}) => {
  const router = useRouter();
  const { input, query, submit } = useDiscoverSearch();
  const trimmed = input.trim();
  // Only show while the user is editing — once the query is committed and the
  // body view takes over, hide the dropdown to avoid double-rendering matches.
  const isDirty = trimmed !== query;
  const isVisible = enabled && trimmed.length > 0 && isDirty;
  // A space anywhere in the live input promotes from keyword → semantic mode.
  const isSemanticMode = input.includes(' ');

  // Defer the semantic input by a tick so we don't fire an LLM round-trip on
  // every keystroke. The cheap origin/resource queries can stay live.
  const deferredSemanticInput = useDeferredValue(isSemanticMode ? trimmed : '');

  const originSearch = api.public.origins.search.useQuery(
    { search: trimmed, limit: 5 },
    { enabled: isVisible && !isSemanticMode }
  );
  const resourceSearch = api.public.resources.search.useQuery(
    { search: trimmed, limit: 5 },
    { enabled: isVisible && !isSemanticMode }
  );
  const semanticSearch = api.public.discover.search.useQuery(
    { query: deferredSemanticInput },
    { enabled: isVisible && isSemanticMode && deferredSemanticInput.length > 0 }
  );

  if (!isVisible) return null;

  const origins = originSearch.data ?? [];
  const resources = resourceSearch.data ?? [];
  const semanticResults = semanticSearch.data ?? [];
  const keywordLoading = originSearch.isLoading || resourceSearch.isLoading;
  const semanticLoading =
    semanticSearch.isLoading || trimmed !== deferredSemanticInput;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border bg-popover shadow-lg overflow-hidden">
      {isSemanticMode ? (
        semanticLoading ? (
          <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Searching x402 services for &quot;{trimmed}&quot;…
          </div>
        ) : semanticResults.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto">
            <li className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Best matches
            </li>
            {semanticResults.map(result => (
              <li key={result.origin}>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => submit()}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-accent text-left"
                >
                  <Favicon url={result.favicon} className="size-6 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {result.title || new URL(result.origin).hostname}
                    </div>
                    {result.description ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {result.description}
                      </div>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-3 py-3 text-sm text-muted-foreground">
            No semantic matches. Press Enter to refine.
          </div>
        )
      ) : keywordLoading ? (
        <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Searching origins…
        </div>
      ) : origins.length === 0 && resources.length === 0 ? (
        <div className="px-3 py-3 text-sm text-muted-foreground">
          No matching origins or resources. Add a space to search by phrase.
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto">
          {origins.length > 0 ? (
            <>
              <li className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Origins
              </li>
              {origins.map(origin => (
                <li key={`origin-${origin.id}`}>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => router.push(`/server/${origin.id}`)}
                    className="w-full px-3 py-2 hover:bg-accent text-left"
                  >
                    <Origin
                      origin={origin}
                      addresses={Array.from(
                        new Set(
                          origin.resources.flatMap(resource =>
                            resource.accepts.map(accept => accept.payTo)
                          )
                        )
                      )}
                    />
                  </button>
                </li>
              ))}
            </>
          ) : null}
          {resources.length > 0 ? (
            <>
              <li className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Resources
              </li>
              {resources.map(resource => (
                <li key={`resource-${resource.id}`}>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => router.push(`/server/${resource.origin.id}`)}
                    className="w-full px-3 py-2 hover:bg-accent text-left"
                  >
                    <Resource resource={resource} />
                  </button>
                </li>
              ))}
            </>
          ) : null}
        </ul>
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
          <Plus className="size-4" />
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
    x402Results.filter(r => r.endpoint).map(r => [r.origin, r.endpoint!])
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
    return (
      (searchOrder.get(aOrigin) ?? Infinity) -
      (searchOrder.get(bOrigin) ?? Infinity)
    );
  });

  return <DataTable columns={discoverColumns} data={allItems} pageSize={10} />;
};
