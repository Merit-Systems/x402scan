'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';

import { api } from '@/trpc/client';
import { useDebounce } from '@/hooks/use-debounce';

import { Origin } from '@/app/(app)/_components/origins';
import { Resource } from '@/app/(app)/_components/resource';
import { Favicon } from '@/app/(app)/_components/favicon';

interface Props {
  /** Live input value (uncommitted). */
  input: string;
  /** Whether the dropdown is allowed to render. */
  enabled: boolean;
  /**
   * Optional currently-committed query. When the trimmed input matches this,
   * the dropdown is hidden — useful on pages where committing the query
   * renders a body-level results view that would otherwise duplicate matches.
   */
  committedQuery?: string;
  /**
   * Called when a user picks a row in semantic mode (or any time we want to
   * hand off to a "full results" view). Default is to do nothing — caller
   * should typically navigate to a full search results page.
   */
  onSubmit?: () => void;
}

/**
 * Live two-mode dropdown of search suggestions:
 *  - pre-space: keyword origin/resource matches via x402scan's own DB
 *  - post-space (input contains a space): semantic LLM-backed search
 *
 * Renders absolutely positioned beneath whatever input owns it; the parent
 * must be `position: relative`.
 */
export const InlineSearchSuggestions: React.FC<Props> = ({
  input,
  enabled,
  committedQuery,
  onSubmit,
}) => {
  const trimmed = input.trim();
  const isDirty = committedQuery === undefined || trimmed !== committedQuery;
  const isVisible = enabled && trimmed.length > 0 && isDirty;
  // A space anywhere in the live input promotes from keyword → semantic mode.
  const isSemanticMode = input.includes(' ');

  // Real debounce on the LLM-backed semantic search — useDeferredValue only
  // batches React state, it doesn't suppress requests, so rapid typing in
  // semantic mode would still hammer the upstream LLM. Cheap keyword queries
  // (origins/resources) stay live since they're DB-fast.
  const debouncedSemanticInput = useDebounce(
    isSemanticMode ? trimmed : '',
    250
  );

  const originSearch = api.public.origins.search.useQuery(
    { search: trimmed, limit: 5 },
    { enabled: isVisible && !isSemanticMode }
  );
  const resourceSearch = api.public.resources.search.useQuery(
    { search: trimmed, limit: 5 },
    { enabled: isVisible && !isSemanticMode }
  );
  const semanticSearch = api.public.discover.search.useQuery(
    { query: debouncedSemanticInput },
    {
      enabled: isVisible && isSemanticMode && debouncedSemanticInput.length > 0,
    }
  );

  if (!isVisible) return null;

  const origins = originSearch.data ?? [];
  const resources = resourceSearch.data ?? [];
  // x402scan only surfaces x402 services — MPP-only results from the upstream
  // semantic API would lead to "No x402 results found" if clicked through.
  const semanticResults = (semanticSearch.data ?? []).filter(r =>
    r.protocols.includes('x402')
  );
  const keywordLoading = originSearch.isLoading || resourceSearch.isLoading;
  const semanticLoading =
    semanticSearch.isLoading || trimmed !== debouncedSemanticInput;

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
                  onClick={() => onSubmit?.()}
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
                  <Link
                    href={`/server/${origin.id}`}
                    onMouseDown={e => e.preventDefault()}
                    className="block px-3 py-2 hover:bg-accent text-left"
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
                  </Link>
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
                  <Link
                    href={`/server/${resource.origin.id}`}
                    onMouseDown={e => e.preventDefault()}
                    className="block px-3 py-2 hover:bg-accent text-left"
                  >
                    <Resource resource={resource} />
                  </Link>
                </li>
              ))}
            </>
          ) : null}
        </ul>
      )}
    </div>
  );
};
