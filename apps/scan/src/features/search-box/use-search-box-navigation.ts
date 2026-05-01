'use client';

import { useCallback, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';

import { normalizeAutocompleteText } from './matching';

interface UseSearchBoxNavigationOptions {
  query: string;
  inputRef: RefObject<HTMLInputElement | null>;
  isMobileViewport: boolean;
  setSelectedSuggestionIndex: Dispatch<SetStateAction<number | null>>;
}

export function useSearchBoxNavigation({
  query,
  inputRef,
  isMobileViewport,
  setSelectedSuggestionIndex,
}: UseSearchBoxNavigationOptions) {
  const inputQuery = normalizeAutocompleteText(query);
  const [committedQuery, setCommittedQuery] = useState('');

  const exitResultsMode = useCallback(() => {
    setCommittedQuery('');
  }, []);

  const openCommittedSearch = useCallback(() => {
    if (!inputQuery) return;

    setSelectedSuggestionIndex(null);
    setCommittedQuery(inputQuery);

    if (isMobileViewport) {
      inputRef.current?.blur();
    }
  }, [inputQuery, inputRef, isMobileViewport, setSelectedSuggestionIndex]);

  return {
    committedQuery,
    exitResultsMode,
    openCommittedSearch,
  };
}
