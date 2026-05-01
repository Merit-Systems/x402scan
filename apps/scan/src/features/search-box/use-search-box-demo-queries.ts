'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

interface UseSearchBoxDemoQueriesOptions {
  demoQueries?: readonly string[];
  exitResultsMode: () => void;
  isInputFocused: boolean;
  setQuery: Dispatch<SetStateAction<string>>;
  setSelectedSuggestionIndex: Dispatch<SetStateAction<number | null>>;
}

export function useSearchBoxDemoQueries({
  demoQueries,
  exitResultsMode,
  isInputFocused,
  setQuery,
  setSelectedSuggestionIndex,
}: UseSearchBoxDemoQueriesOptions) {
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const queries = useMemo(
    () => demoQueries?.filter(Boolean) ?? [],
    [demoQueries]
  );
  const actionsRef = useRef({
    exitResultsMode,
    setQuery,
    setSelectedSuggestionIndex,
  });

  useEffect(() => {
    actionsRef.current = {
      exitResultsMode,
      setQuery,
      setSelectedSuggestionIndex,
    };
  }, [exitResultsMode, setQuery, setSelectedSuggestionIndex]);

  useEffect(() => {
    if (queries.length === 0 || hasUserInteracted || isInputFocused) {
      return;
    }

    const timeouts: number[] = [];
    let cancelled = false;

    // StrictMode can start this effect twice in development; cleanup below
    // clears every scheduled timeout and cancels callbacks from the old run.
    const schedule = (callback: () => void, delayMs: number) => {
      const timeout = window.setTimeout(() => {
        if (!cancelled) {
          callback();
        }
      }, delayMs);
      timeouts.push(timeout);
    };

    const runCycle = (index: number) => {
      const phrase = queries[index % queries.length] ?? '';
      let cursor = 0;
      const actions = actionsRef.current;

      actions.exitResultsMode();
      actions.setSelectedSuggestionIndex(null);
      actions.setQuery('');

      const typeNext = () => {
        cursor += 1;
        actionsRef.current.setQuery(phrase.slice(0, cursor));

        if (cursor < phrase.length) {
          schedule(typeNext, 55);
          return;
        }

        schedule(deleteNext, 1450);
      };

      const deleteNext = () => {
        cursor -= 1;
        actionsRef.current.setQuery(phrase.slice(0, Math.max(cursor, 0)));

        if (cursor > 0) {
          schedule(deleteNext, 24);
          return;
        }

        schedule(() => runCycle(index + 1), 380);
      };

      schedule(typeNext, 320);
    };

    runCycle(0);

    return () => {
      cancelled = true;
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, [hasUserInteracted, isInputFocused, queries]);

  const markUserInteracted = useCallback(
    (options?: { preserveQuery?: boolean }) => {
      if (queries.length === 0 || hasUserInteracted) {
        return;
      }

      setHasUserInteracted(true);

      const actions = actionsRef.current;
      actions.exitResultsMode();
      actions.setSelectedSuggestionIndex(null);
      if (!options?.preserveQuery) {
        actions.setQuery('');
      }
    },
    [hasUserInteracted, queries.length]
  );

  return { hasUserInteracted, markUserInteracted };
}
