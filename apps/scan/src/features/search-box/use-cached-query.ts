'use client';

import { useEffect, useRef, useState } from 'react';

export interface QueryCacheRef<T> {
  current: Map<string, T>;
}

export interface QueryInFlightRef<T> {
  current: Map<string, Promise<T>>;
}

interface CachedQueryState<T> {
  data: T | null;
  loading: boolean;
  requestError: boolean;
  usingFallback: boolean;
}

interface CachedQueryOptions<T> {
  query: string;
  cacheKey: string;
  delayMs: number;
  request: (query: string, signal?: AbortSignal) => Promise<T>;
  getFallback?: (cache: Map<string, T>, query: string) => T | null;
  initialCache?: Record<string, T>;
  networkEnabled?: boolean;
}

function idleState<T>(): CachedQueryState<T> {
  return {
    data: null,
    loading: false,
    requestError: false,
    usingFallback: false,
  };
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

export function useCachedQuery<T>({
  query,
  cacheKey,
  delayMs,
  request,
  getFallback,
  initialCache,
  networkEnabled = true,
}: CachedQueryOptions<T>) {
  const [state, setState] = useState<CachedQueryState<T>>(() => idleState());
  const cacheRef = useRef(new Map<string, T>());
  const inFlightRef = useRef(new Map<string, Promise<T>>());
  const abortRef = useRef<AbortController | null>(null);
  const activeQueryRef = useRef('');
  const activeCacheKeyRef = useRef(cacheKey);
  const requestRef = useRef(request);

  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  useEffect(() => {
    activeCacheKeyRef.current = cacheKey;
    cacheRef.current.clear();
    for (const [key, value] of Object.entries(initialCache ?? {})) {
      cacheRef.current.set(key, value);
    }
    inFlightRef.current.clear();
  }, [cacheKey, initialCache]);

  useEffect(() => {
    abortRef.current?.abort();

    if (!query) {
      activeQueryRef.current = '';
      setState(idleState());
      return;
    }

    activeQueryRef.current = query;

    const cached = cacheRef.current.get(query);
    if (cached) {
      setState({
        data: cached,
        loading: false,
        requestError: false,
        usingFallback: false,
      });
      return;
    }

    const fallback = getFallback?.(cacheRef.current, query) ?? null;
    if (!networkEnabled) {
      setState({
        data: fallback,
        loading: false,
        requestError: false,
        usingFallback: Boolean(fallback),
      });
      return;
    }

    setState({
      data: fallback,
      loading: true,
      requestError: false,
      usingFallback: Boolean(fallback),
    });

    const controller = new AbortController();
    abortRef.current = controller;

    const timeout = window.setTimeout(() => {
      void (async () => {
        let promise = inFlightRef.current.get(query);
        const requestCacheKey = cacheKey;
        try {
          if (!promise) {
            promise = requestRef.current(query, controller.signal);
            inFlightRef.current.set(query, promise);
          }

          const response = await promise;
          if (activeCacheKeyRef.current !== requestCacheKey) return;

          cacheRef.current.set(query, response);

          if (activeQueryRef.current === query) {
            setState({
              data: response,
              loading: false,
              requestError: false,
              usingFallback: false,
            });
          }
        } catch (error) {
          if (isAbortError(error)) return;

          if (activeQueryRef.current === query) {
            setState(previous => ({
              ...previous,
              loading: false,
              requestError: true,
            }));
          }
        } finally {
          if (inFlightRef.current.get(query) === promise) {
            inFlightRef.current.delete(query);
          }
        }
      })();
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [cacheKey, delayMs, getFallback, networkEnabled, query]);

  return {
    ...state,
    cacheRef,
    inFlightRef,
  };
}
