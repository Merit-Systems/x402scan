'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';

import { normalizeAutocompleteText } from './matching';

interface UseSearchBoxNavigationOptions {
  query: string;
  inputRef: RefObject<HTMLInputElement | null>;
  isMobileViewport: boolean;
  setQuery: Dispatch<SetStateAction<string>>;
  setSelectedSuggestionIndex: Dispatch<SetStateAction<number | null>>;
}

type NavigationMode = 'push' | 'replace';

function getSearchBoxUrl(
  pathname: string,
  searchParams: string,
  query: string | null
) {
  const params = new URLSearchParams(searchParams);

  if (query) {
    params.set('q', query);
  } else {
    params.delete('q');
  }

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function useSearchBoxNavigation({
  query,
  inputRef,
  isMobileViewport,
  setQuery,
  setSelectedSuggestionIndex,
}: UseSearchBoxNavigationOptions) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = normalizeAutocompleteText(searchParams.get('q') ?? '');
  const inputQuery = normalizeAutocompleteText(query);
  const [committedQuery, setCommittedQuery] = useState('');

  const writeUrlQuery = useCallback(
    (nextQuery: string | null, mode: NavigationMode) => {
      router[mode](
        getSearchBoxUrl(pathname, searchParams.toString(), nextQuery) as Route,
        {
          scroll: false,
        }
      );
    },
    [pathname, router, searchParams]
  );

  const exitResultsMode = useCallback(() => {
    setCommittedQuery('');

    if (urlQuery) {
      writeUrlQuery(null, 'replace');
    }
  }, [urlQuery, writeUrlQuery]);

  const openCommittedSearch = useCallback(() => {
    if (!inputQuery) return;

    setSelectedSuggestionIndex(null);
    setCommittedQuery(inputQuery);

    if (urlQuery !== inputQuery) {
      writeUrlQuery(inputQuery, 'push');
    }

    if (isMobileViewport) {
      inputRef.current?.blur();
    }
  }, [
    inputQuery,
    inputRef,
    isMobileViewport,
    setSelectedSuggestionIndex,
    urlQuery,
    writeUrlQuery,
  ]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // URL search params are external navigation state; mirror them into the
    // controlled input so back/forward and shared links restore the search.
    if (!urlQuery) {
      setCommittedQuery('');
      return;
    }

    setCommittedQuery(urlQuery);
    setSelectedSuggestionIndex(null);
    setQuery(current =>
      normalizeAutocompleteText(current) === urlQuery ? current : urlQuery
    );
  }, [setQuery, setSelectedSuggestionIndex, urlQuery]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    committedQuery,
    exitResultsMode,
    openCommittedSearch,
  };
}
