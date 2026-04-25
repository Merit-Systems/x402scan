'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { Command } from '@/components/ui/command';

import { isEditableTarget, isTextEditingKey } from './helpers';
import {
  SearchFeedbackDialog,
  SearchBoxInputBar,
  SearchBoxPopover,
  SearchBoxTelemetry,
  type SearchBoxShortcut,
} from './search-box-chrome';
import {
  SearchResultsPanel,
  SearchSuggestionsPanel,
} from './search-box-panels';
import { useSearchBoxTelemetryReporter } from './search-box-telemetry';
import type {
  AutocompleteCacheSnapshot,
  AutocompleteSuggestion,
  SearchBoxFeedbackContext,
  SearchBoxLayout,
  SearchBoxPreviewMode,
  SearchBoxSelectionContext,
  SearchPreviewResult,
  SearchProtocol,
} from './types';
import { useSearchBoxData } from './use-search-box-data';
import { useSearchBoxDemoQueries } from './use-search-box-demo-queries';
import { useSearchBoxNavigation } from './use-search-box-navigation';

export interface SearchBoxProps {
  apiBaseUrl?: string;
  onSelectSuggestion?: (
    suggestion: AutocompleteSuggestion,
    context: SearchBoxSelectionContext
  ) => void;
  onSelectResult?: (
    result: SearchPreviewResult,
    context: SearchBoxSelectionContext
  ) => void;
  onReportBadResults?: (context: SearchBoxFeedbackContext) => void;
  onSearchSubmit?: (query: string) => void;
  autoFocus?: boolean;
  demoQueries?: readonly string[];
  enableKeyboardShortcut?: boolean;
  initialAutocompleteCache?: AutocompleteCacheSnapshot;
  layout?: SearchBoxLayout;
  previewMode?: SearchBoxPreviewMode;
  protocols?: SearchProtocol[];
  showFeedbackControls?: boolean;
}

export function SearchBox({
  apiBaseUrl,
  autoFocus,
  demoQueries,
  enableKeyboardShortcut = true,
  initialAutocompleteCache,
  layout = 'page',
  onSelectSuggestion,
  onSelectResult,
  onReportBadResults,
  onSearchSubmit,
  previewMode = 'off',
  protocols,
  showFeedbackControls = false,
}: SearchBoxProps = {}) {
  const [query, setQuery] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackReportedKey, setFeedbackReportedKey] = useState<string | null>(
    null
  );
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<
    number | null
  >(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shouldAutoFocus = autoFocus ?? layout === 'page';
  const protocolKey = protocols?.join(',') ?? '';
  const requestOptions = useMemo(() => {
    return {
      apiBaseUrl,
      protocols: protocolKey
        ? (protocolKey.split(',') as SearchProtocol[])
        : undefined,
    };
  }, [apiBaseUrl, protocolKey]);
  const { committedQuery, exitResultsMode, openCommittedSearch } =
    useSearchBoxNavigation({
      query,
      inputRef,
      isMobileViewport,
      setQuery,
      setSelectedSuggestionIndex,
    });
  const { hasUserInteracted, markUserInteracted } = useSearchBoxDemoQueries({
    demoQueries: previewMode === 'animated' ? demoQueries : undefined,
    exitResultsMode,
    isInputFocused,
    setQuery,
    setSelectedSuggestionIndex,
  });
  // Passive homepage animation uses the server-rendered cache only. Live
  // requests begin on focus, click, or typing.
  const liveDataEnabled = previewMode !== 'animated' || hasUserInteracted;
  const {
    autocompleteData,
    autocompleteLoading,
    autocompleteRequestError,
    searchData,
    searchLoading,
    searchRequestError,
    usingFallback,
  } = useSearchBoxData(query, requestOptions, {
    initialAutocompleteCache,
    networkEnabled: liveDataEnabled,
  });

  const suggestions = autocompleteData?.suggestions ?? [];
  const searchResults = searchData?.results ?? [];
  const hasTypedQuery = query.trim().length > 0;
  const isResultsMode = Boolean(committedQuery);
  const isSuggestionSelectionMode =
    hasTypedQuery &&
    !isResultsMode &&
    selectedSuggestionIndex !== null &&
    selectedSuggestionIndex >= 0 &&
    selectedSuggestionIndex < suggestions.length;
  const isCommittedSearchResponse = searchData?.query === committedQuery;
  const showDropdown =
    hasTypedQuery &&
    (isResultsMode ||
      autocompleteLoading ||
      suggestions.length > 0 ||
      autocompleteRequestError);
  const activeSuggestionIndex = isSuggestionSelectionMode
    ? selectedSuggestionIndex
    : null;
  const visibleSearchResults = isCommittedSearchResponse ? searchResults : [];
  const feedbackEnabled = showFeedbackControls && Boolean(onReportBadResults);
  const feedbackKey = `${isResultsMode ? 'search' : 'autocomplete'}:${query.trim()}`;
  const feedbackReported = feedbackReportedKey === feedbackKey;
  const telemetryReporter = useSearchBoxTelemetryReporter({
    autocompleteLatencyMs: autocompleteData?.latencyMs ?? null,
    query,
    searchLatencyMs: searchData?.latencyMs ?? null,
    searchResults: visibleSearchResults,
    suggestions,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const updateViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    updateViewport();

    mediaQuery.addEventListener('change', updateViewport);
    return () => {
      mediaQuery.removeEventListener('change', updateViewport);
    };
  }, []);

  useEffect(() => {
    if (!enableKeyboardShortcut) return;

    function handleGlobalShortcut(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape' && isResultsMode) {
        if (
          isEditableTarget(event.target) &&
          event.target !== inputRef.current
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        exitResultsMode();
        return;
      }

      const shortcutPressed =
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'k';

      if (!shortcutPressed) return;
      if (isEditableTarget(event.target) && event.target !== inputRef.current) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();

      if (inputRef.current?.value.trim()) {
        inputRef.current?.select();
      }
    }

    window.addEventListener('keydown', handleGlobalShortcut);
    return () => {
      window.removeEventListener('keydown', handleGlobalShortcut);
    };
  }, [enableKeyboardShortcut, exitResultsMode, isResultsMode]);

  function focusSearchInput() {
    inputRef.current?.focus();
    if (inputRef.current?.value.trim()) {
      inputRef.current?.select();
    }
  }

  function selectSuggestion(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion) return;

    const context = telemetryReporter.reportSelection('autocomplete', index);
    setSelectedSuggestionIndex(null);

    if (onSelectSuggestion && context) {
      onSelectSuggestion(suggestion, context);
      return;
    }

    setQuery(suggestion.text);
  }

  function selectResult(result: SearchPreviewResult, index: number) {
    const context = telemetryReporter.reportSelection('search', index);

    if (onSelectResult && context) {
      onSelectResult(result, context);
      return;
    }

    setQuery(result.title);
  }

  function submitSearch() {
    const submittedQuery = query.trim();
    if (!submittedQuery) return;

    onSearchSubmit?.(submittedQuery);
    openCommittedSearch();
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (isResultsMode) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        exitResultsMode();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        if (suggestions.length === 0) return;
        event.preventDefault();
        event.stopPropagation();
        setSelectedSuggestionIndex(index =>
          index === null ? 0 : Math.min(index + 1, suggestions.length - 1)
        );
        return;

      case 'ArrowUp':
        if (selectedSuggestionIndex === null) return;
        event.preventDefault();
        event.stopPropagation();
        setSelectedSuggestionIndex(index =>
          index === null || index <= 0 ? null : index - 1
        );
        return;

      case 'Escape':
        if (selectedSuggestionIndex === null) return;
        event.preventDefault();
        event.stopPropagation();
        setSelectedSuggestionIndex(null);
        return;

      case 'Enter':
        event.preventDefault();
        event.stopPropagation();
        if (activeSuggestionIndex !== null) {
          selectSuggestion(activeSuggestionIndex);
          return;
        }

        submitSearch();
        return;

      default:
        if (selectedSuggestionIndex !== null && isTextEditingKey(event)) {
          setSelectedSuggestionIndex(null);
        }
    }
  }

  function runBarAction() {
    if (!isInputFocused || !hasTypedQuery) {
      focusSearchInput();
      return;
    }

    if (isResultsMode) {
      exitResultsMode();
      return;
    }

    if (activeSuggestionIndex !== null) {
      selectSuggestion(activeSuggestionIndex);
      return;
    }

    submitSearch();
  }

  function reportFeedback(pipeline: 'autocomplete' | 'search', note: string) {
    const feedbackNote = note.trim();
    onReportBadResults?.(
      telemetryReporter.reportFeedback(pipeline, feedbackNote || undefined)
    );
    setFeedbackReportedKey(`${pipeline}:${query.trim()}`);
  }

  const barShortcut: SearchBoxShortcut | null =
    !enableKeyboardShortcut && (!isInputFocused || !hasTypedQuery)
      ? null
      : !isInputFocused || !hasTypedQuery
        ? {
            key: '⌘K',
            label: 'Focus',
          }
        : isResultsMode
          ? {
              key: 'Esc',
              label: 'Suggestions',
            }
          : isSuggestionSelectionMode
            ? {
                key: 'Enter',
                label: 'Select',
              }
            : {
                key: 'Enter',
                label: 'Search',
              };
  const outerClassName =
    layout === 'page'
      ? 'flex flex-1 items-center justify-center px-4 py-8 sm:px-6'
      : 'w-full';
  const innerClassName =
    layout === 'page' ? 'w-full max-w-3xl' : 'w-full max-w-3xl';

  return (
    <div
      className={outerClassName}
      onPointerDownCapture={event => {
        const preserveQuery =
          event.target instanceof Element &&
          Boolean(event.target.closest('[data-search-box-popover]'));
        markUserInteracted({ preserveQuery });
      }}
    >
      <div className={innerClassName}>
        <h1 className="sr-only">x402 Search</h1>

        <Command
          shouldFilter={false}
          className="relative overflow-visible rounded-none border-0 bg-transparent shadow-none"
        >
          <SearchBoxInputBar
            inputRef={inputRef}
            autoFocus={shouldAutoFocus}
            isResultsMode={isResultsMode}
            query={query}
            onFocus={() => {
              markUserInteracted();
              setIsInputFocused(true);
            }}
            onBlur={() => setIsInputFocused(false)}
            onValueChange={value => {
              if (isInputFocused) {
                markUserInteracted();
              }
              setQuery(value);
              setSelectedSuggestionIndex(null);
              exitResultsMode();
            }}
            onKeyDown={handleInputKeyDown}
            onBackToSuggestions={exitResultsMode}
            onRunAction={runBarAction}
            shortcut={barShortcut}
          />

          <SearchBoxPopover open={showDropdown}>
            {isResultsMode ? (
              <SearchResultsPanel
                results={visibleSearchResults}
                loading={searchLoading || !isCommittedSearchResponse}
                requestError={searchRequestError}
                onSelectResult={selectResult}
              />
            ) : (
              <SearchSuggestionsPanel
                query={query}
                suggestions={suggestions}
                loading={autocompleteLoading}
                requestError={autocompleteRequestError}
                selectedSuggestionIndex={activeSuggestionIndex}
                onSelectSuggestion={selectSuggestion}
              />
            )}

            <SearchBoxTelemetry
              autocompleteLatencyMs={autocompleteData?.latencyMs ?? null}
              autocompleteLoading={autocompleteLoading}
              onReportBadResults={
                feedbackEnabled ? () => setFeedbackDialogOpen(true) : undefined
              }
              reported={feedbackReported}
              searchLatencyMs={searchData?.latencyMs ?? null}
              showSearchLatency={liveDataEnabled || isResultsMode}
              usingFallback={usingFallback}
            />
          </SearchBoxPopover>
          <SearchFeedbackDialog
            open={feedbackDialogOpen}
            onOpenChange={setFeedbackDialogOpen}
            onSubmit={note => {
              reportFeedback(isResultsMode ? 'search' : 'autocomplete', note);
              setFeedbackDialogOpen(false);
            }}
          />
        </Command>
      </div>
    </div>
  );
}
