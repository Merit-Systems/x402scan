'use client';

import { useCallback, useDeferredValue, useEffect, useRef } from 'react';

import { requestAutocomplete, requestSearch } from './api-client';
import {
  getClosestCachedResponse,
  getLikelyNextPrefixes,
  normalizeAutocompleteText,
} from './matching';
import type {
  AutocompleteCacheSnapshot,
  AutocompleteOutput,
  SearchBoxRequestOptions,
} from './types';
import {
  type QueryCacheRef,
  type QueryInFlightRef,
  useCachedQuery,
} from './use-cached-query';

function useAutocompletePrefetch({
  data,
  cacheKey,
  inFlightRef,
  query,
  requestOptions,
  cacheRef,
}: {
  query: string;
  cacheKey: string;
  data: AutocompleteOutput | null;
  requestOptions: SearchBoxRequestOptions;
  cacheRef: QueryCacheRef<AutocompleteOutput>;
  inFlightRef: QueryInFlightRef<AutocompleteOutput>;
}) {
  const activeCacheKeyRef = useRef(cacheKey);

  useEffect(() => {
    activeCacheKeyRef.current = cacheKey;
  }, [cacheKey]);

  useEffect(() => {
    if (!query || !data) return;

    const nextPrefixes = getLikelyNextPrefixes(data, query);
    for (const prefix of nextPrefixes) {
      if (cacheRef.current.has(prefix) || inFlightRef.current.has(prefix)) {
        continue;
      }

      const promise = requestAutocomplete({
        query: prefix,
        options: requestOptions,
      }).then(response => {
        if (activeCacheKeyRef.current === cacheKey) {
          cacheRef.current.set(prefix, response);
        }
        return response;
      });
      inFlightRef.current.set(prefix, promise);
      void promise
        .catch(() => {
          // Prefetch is opportunistic; visible requests own error handling.
        })
        .finally(() => {
          if (inFlightRef.current.get(prefix) === promise) {
            inFlightRef.current.delete(prefix);
          }
        });
    }
  }, [cacheKey, cacheRef, data, inFlightRef, query, requestOptions]);
}

export function useSearchBoxData(
  query: string,
  requestOptions: SearchBoxRequestOptions = {},
  options: {
    initialAutocompleteCache?: AutocompleteCacheSnapshot;
    networkEnabled?: boolean;
  } = {}
) {
  const networkEnabled = options.networkEnabled ?? true;
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeAutocompleteText(deferredQuery);
  const cacheKey = JSON.stringify({
    apiBaseUrl: requestOptions.apiBaseUrl ?? '',
    protocols: requestOptions.protocols ?? [],
  });
  const fetchAutocomplete = useCallback(
    (nextQuery: string, signal?: AbortSignal) =>
      requestAutocomplete({
        query: nextQuery,
        options: requestOptions,
        signal,
      }),
    [requestOptions]
  );
  const fetchSearch = useCallback(
    (nextQuery: string, signal?: AbortSignal) =>
      requestSearch({ query: nextQuery, options: requestOptions, signal }),
    [requestOptions]
  );

  const autocomplete = useCachedQuery({
    query: normalizedQuery,
    cacheKey,
    delayMs: 50,
    request: fetchAutocomplete,
    getFallback: getClosestCachedResponse,
    initialCache: options.initialAutocompleteCache,
    networkEnabled,
  });
  const search = useCachedQuery({
    query: normalizedQuery,
    cacheKey,
    delayMs: 120,
    request: fetchSearch,
    networkEnabled,
  });

  useAutocompletePrefetch({
    query: normalizedQuery,
    cacheKey,
    data: networkEnabled ? autocomplete.data : null,
    requestOptions,
    cacheRef: autocomplete.cacheRef,
    inFlightRef: autocomplete.inFlightRef,
  });

  return {
    autocompleteData: autocomplete.data,
    autocompleteLoading: autocomplete.loading,
    autocompleteRequestError: autocomplete.requestError,
    searchData: search.data,
    searchLoading: search.loading,
    searchRequestError: search.requestError,
    usingFallback: autocomplete.usingFallback,
  };
}
