'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import { Command } from '@/components/ui/command';

import { isEditableTarget, isTextEditingKey } from './helpers';
import {
  type SearchBoxBarAction,
  SearchFeedbackDialog,
  SearchBoxInputBar,
  SearchBoxPopover,
  SearchBoxTelemetry,
} from './search-box-chrome';
import {
  SearchResultsPanel,
  SearchSuggestionsPanel,
} from './search-box-panels';
import { useSearchBoxTelemetryReporter } from './search-box-telemetry';
import { normalizeAutocompleteText } from './matching';
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

type SearchPanelMode = 'suggestions' | 'results';

interface SearchPanelStateInput {
  activePanelMode: SearchPanelMode;
  autocompleteLoading: boolean;
  autocompleteRequestError: boolean;
  hasCommittedSearch: boolean;
  hasTypedQuery: boolean;
  isCurrentSearchResponse: boolean;
  searchLoading: boolean;
  searchRequestError: boolean;
  searchResults: SearchPreviewResult[];
  selectedResultIndex: number | null;
  selectedSuggestionIndex: number | null;
  shouldPromoteLiveResults: boolean;
  suggestions: AutocompleteSuggestion[];
}

interface SearchPanelState {
  kind: 'closed' | SearchPanelMode;
  activeResultIndex: number | null;
  activeSuggestionIndex: number | null;
  hasActiveSelection: boolean;
  hasSelectableRows: boolean;
  isLiveResults: boolean;
  results: SearchPreviewResult[];
  resultsLoading: boolean;
}

function validIndex(index: number | null, rowCount: number, disabled = false) {
  if (disabled || index === null || index < 0 || index >= rowCount) {
    return null;
  }

  return index;
}

function getSearchPanelState({
  activePanelMode,
  autocompleteLoading,
  autocompleteRequestError,
  hasCommittedSearch,
  hasTypedQuery,
  isCurrentSearchResponse,
  searchLoading,
  searchRequestError,
  searchResults,
  selectedResultIndex,
  selectedSuggestionIndex,
  shouldPromoteLiveResults,
  suggestions,
}: SearchPanelStateInput): SearchPanelState {
  const showResults =
    hasTypedQuery &&
    (hasCommittedSearch ||
      activePanelMode === 'results' ||
      shouldPromoteLiveResults);

  if (showResults) {
    const results = isCurrentSearchResponse ? searchResults : [];
    const resultsLoading =
      searchLoading || (!isCurrentSearchResponse && !searchRequestError);
    const activeResultIndex = validIndex(
      selectedResultIndex,
      results.length,
      resultsLoading
    );

    return {
      kind: 'results',
      activeResultIndex,
      activeSuggestionIndex: null,
      hasActiveSelection: activeResultIndex !== null,
      hasSelectableRows: !resultsLoading && results.length > 0,
      isLiveResults: !hasCommittedSearch,
      results,
      resultsLoading,
    };
  }

  const showSuggestions =
    hasTypedQuery &&
    (autocompleteLoading || suggestions.length > 0 || autocompleteRequestError);
  const activeSuggestionIndex = showSuggestions
    ? validIndex(selectedSuggestionIndex, suggestions.length)
    : null;

  return {
    kind: showSuggestions ? 'suggestions' : 'closed',
    activeResultIndex: null,
    activeSuggestionIndex,
    hasActiveSelection: activeSuggestionIndex !== null,
    hasSelectableRows: showSuggestions && suggestions.length > 0,
    isLiveResults: false,
    results: [],
    resultsLoading: false,
  };
}

function getNextPanelMode({
  hasResolvedSuggestions,
  hasCommittedSearch,
  hasTypedQuery,
  shouldPromoteLiveResults,
}: {
  hasResolvedSuggestions: boolean;
  hasCommittedSearch: boolean;
  hasTypedQuery: boolean;
  shouldPromoteLiveResults: boolean;
}): SearchPanelMode | null {
  // Null keeps the current surface while network state is unresolved.
  if (!hasTypedQuery) return 'suggestions';
  if (hasCommittedSearch || shouldPromoteLiveResults) return 'results';
  if (hasResolvedSuggestions) return 'suggestions';
  return null;
}

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
  const [focusRequestId, setFocusRequestId] = useState(0);
  const [activePanelMode, setActivePanelMode] =
    useState<SearchPanelMode>('suggestions');
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(
    null
  );
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<
    number | null
  >(null);
  const [dropdownDismissed, setDropdownDismissed] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
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
  const hasCommittedSearch = Boolean(committedQuery);
  const normalizedQuery = normalizeAutocompleteText(query);
  const isCurrentAutocompleteResponse =
    autocompleteData?.query === normalizedQuery;
  const isCurrentSearchResponse = searchData?.query === normalizedQuery;
  const autocompleteSettledForQuery =
    hasTypedQuery &&
    !hasCommittedSearch &&
    !autocompleteLoading &&
    !autocompleteRequestError &&
    isCurrentAutocompleteResponse;
  const hasResolvedSuggestions =
    autocompleteSettledForQuery && suggestions.length > 0;
  const hasResolvedEmptySuggestions =
    autocompleteSettledForQuery && suggestions.length === 0;
  // Once the user types a space, switch from keyword suggestions to semantic
  // results. Pre-space we keep the original autocomplete-first experience.
  const queryHasSpace = query.includes(' ');
  const shouldPromoteLiveResults =
    queryHasSpace ||
    (hasResolvedEmptySuggestions &&
      (searchLoading || searchRequestError || isCurrentSearchResponse));
  const nextPanelMode = getNextPanelMode({
    hasResolvedSuggestions,
    hasCommittedSearch,
    hasTypedQuery,
    shouldPromoteLiveResults,
  });
  const visiblePanelMode = nextPanelMode ?? activePanelMode;
  const panel = getSearchPanelState({
    activePanelMode: visiblePanelMode,
    autocompleteLoading,
    autocompleteRequestError,
    hasCommittedSearch,
    hasTypedQuery,
    isCurrentSearchResponse,
    searchLoading,
    searchRequestError,
    searchResults,
    selectedResultIndex,
    selectedSuggestionIndex,
    shouldPromoteLiveResults,
    suggestions,
  });
  const showResultsPanel = panel.kind === 'results';
  const isLiveResultsPanel = panel.isLiveResults;
  const showDropdown = panel.kind !== 'closed' && !dropdownDismissed;
  const activeSuggestionIndex = panel.activeSuggestionIndex;
  const visibleSearchResults = panel.results;
  const resultsPanelLoading = panel.resultsLoading;
  const activeResultIndex = panel.activeResultIndex;
  const hasActiveSelection = panel.hasActiveSelection;
  const hasSelectableRows = panel.hasSelectableRows;
  const feedbackEnabled = showFeedbackControls && Boolean(onReportBadResults);
  const feedbackKey = `${showResultsPanel ? 'search' : 'autocomplete'}:${query.trim()}`;
  const feedbackReported = feedbackReportedKey === feedbackKey;
  const telemetryReporter = useSearchBoxTelemetryReporter({
    autocompleteLatencyMs: autocompleteData?.latencyMs ?? null,
    query,
    searchLatencyMs: searchData?.latencyMs ?? null,
    searchResults: visibleSearchResults,
    suggestions,
  });
  const exitCommittedSearch = useCallback(() => {
    setActivePanelMode('suggestions');
    exitResultsMode();
  }, [exitResultsMode]);

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
    if (focusRequestId === 0) return;

    inputRef.current?.focus();
    if (inputRef.current?.value.trim()) {
      inputRef.current?.select();
    }
  }, [focusRequestId]);

  useEffect(() => {
    if (!enableKeyboardShortcut) return;

    function handleGlobalShortcut(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape' && hasCommittedSearch) {
        if (
          isEditableTarget(event.target) &&
          event.target !== inputRef.current
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        exitCommittedSearch();
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
  }, [enableKeyboardShortcut, exitCommittedSearch, hasCommittedSearch]);

  useEffect(() => {
    if (!showDropdown) return;

    function handleOutsidePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;

      if (rootRef.current?.contains(event.target)) return;

      if (
        event.target instanceof Element &&
        event.target.closest('[data-search-feedback-dialog]')
      ) {
        return;
      }

      setDropdownDismissed(true);
      setSelectedResultIndex(null);
      setSelectedSuggestionIndex(null);
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsidePointerDown,
        true
      );
    };
  }, [showDropdown]);

  function requestSearchInputFocus() {
    setFocusRequestId(id => id + 1);
  }

  function selectSuggestion(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion) return;

    setDropdownDismissed(false);
    const context = telemetryReporter.reportSelection('autocomplete', index);
    setSelectedSuggestionIndex(null);

    if (onSelectSuggestion && context) {
      onSelectSuggestion(suggestion, context);
      return;
    }

    setQuery(suggestion.text);
  }

  function selectResult(result: SearchPreviewResult, index: number) {
    setDropdownDismissed(false);
    const context = telemetryReporter.reportSelection('search', index);
    setSelectedResultIndex(null);

    if (onSelectResult && context) {
      onSelectResult(result, context);
      return;
    }

    setQuery(result.title);
  }

  function submitSearch() {
    const submittedQuery = query.trim();
    if (!submittedQuery) return;

    setActivePanelMode('results');
    setDropdownDismissed(false);
    setSelectedResultIndex(null);
    onSearchSubmit?.(submittedQuery);
    openCommittedSearch();
  }

  function returnToLiveSearch() {
    setDropdownDismissed(false);
    clearActiveSelection();
    exitCommittedSearch();
    requestSearchInputFocus();
  }

  function clearActiveSelection() {
    setSelectedResultIndex(null);
    setSelectedSuggestionIndex(null);
  }

  function selectActiveRow(index: number) {
    if (showResultsPanel) {
      const result = visibleSearchResults[index];
      if (result) selectResult(result, index);
      return;
    }

    selectSuggestion(index);
  }

  function moveSelection(direction: 1 | -1) {
    if (!hasSelectableRows) return false;

    if (showResultsPanel) {
      setSelectedSuggestionIndex(null);
      setSelectedResultIndex(index => {
        if (index === null) {
          return direction > 0 ? 0 : visibleSearchResults.length - 1;
        }
        const nextIndex = index + direction;
        return nextIndex < 0
          ? null
          : Math.min(nextIndex, visibleSearchResults.length - 1);
      });
      return true;
    }

    setSelectedResultIndex(null);
    setSelectedSuggestionIndex(index => {
      if (index === null) return direction > 0 ? 0 : suggestions.length - 1;
      const nextIndex = index + direction;
      return nextIndex < 0 ? null : Math.min(nextIndex, suggestions.length - 1);
    });
    return true;
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        if (!moveSelection(1)) return;
        event.preventDefault();
        event.stopPropagation();
        return;

      case 'ArrowUp':
        if (!hasActiveSelection) return;
        event.preventDefault();
        event.stopPropagation();
        moveSelection(-1);
        return;

      case 'Escape':
        if (!hasActiveSelection && !hasCommittedSearch) return;

        event.preventDefault();
        event.stopPropagation();
        if (hasActiveSelection) {
          clearActiveSelection();
          return;
        }

        if (hasCommittedSearch) {
          exitCommittedSearch();
        }
        return;

      case 'Enter':
        event.preventDefault();
        event.stopPropagation();
        if (activeSuggestionIndex !== null) {
          selectSuggestion(activeSuggestionIndex);
          return;
        }

        if (activeResultIndex !== null) {
          selectActiveRow(activeResultIndex);
          return;
        }

        if (!hasCommittedSearch && !showResultsPanel) {
          submitSearch();
        }
        return;

      default:
        if (isTextEditingKey(event)) {
          clearActiveSelection();
        }
    }
  }

  function reportFeedback(pipeline: 'autocomplete' | 'search', note: string) {
    const feedbackNote = note.trim();
    onReportBadResults?.(
      telemetryReporter.reportFeedback(pipeline, feedbackNote || undefined)
    );
    setFeedbackReportedKey(`${pipeline}:${query.trim()}`);
  }

  const openActiveSelection = () => {
    if (activeSuggestionIndex !== null) {
      selectSuggestion(activeSuggestionIndex);
      return;
    }

    if (activeResultIndex !== null) {
      selectActiveRow(activeResultIndex);
    }
  };
  const selectFirstRow = () => {
    moveSelection(1);
  };
  const barActions: SearchBoxBarAction[] = [];

  if (!isInputFocused) {
    if (enableKeyboardShortcut) {
      barActions.push({
        key: '⌘K',
        label: 'Focus',
        onRun: requestSearchInputFocus,
      });
    }
  } else if (hasTypedQuery && hasActiveSelection) {
    barActions.push({
      key: 'Enter',
      label: 'Open',
      onRun: openActiveSelection,
    });
  } else if (hasTypedQuery) {
    if (hasSelectableRows) {
      barActions.push({
        key: '↓',
        label: 'Select',
        muted: !hasCommittedSearch && !isLiveResultsPanel,
        onRun: selectFirstRow,
      });
    }

    if (!showResultsPanel) {
      barActions.push({
        key: 'Enter',
        label: 'Search',
        onRun: submitSearch,
      });
    }

    if (hasCommittedSearch) {
      barActions.push({
        key: 'Esc',
        label: 'Back',
        muted: hasSelectableRows,
        onRun: returnToLiveSearch,
      });
    }
  }

  const mobileAction: SearchBoxBarAction | null =
    hasTypedQuery && !hasCommittedSearch
      ? hasActiveSelection
        ? {
            label: 'Open',
            onRun: openActiveSelection,
          }
        : isLiveResultsPanel
          ? null
          : {
              label: 'Search',
              onRun: submitSearch,
            }
      : null;
  const outerClassName =
    layout === 'page'
      ? 'flex flex-1 items-center justify-center px-4 py-8 sm:px-6'
      : 'w-full';
  const innerClassName = layout === 'page' ? 'w-full max-w-3xl' : 'w-full';

  return (
    <div
      ref={rootRef}
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
            actions={barActions}
            inputRef={inputRef}
            autoFocus={shouldAutoFocus}
            isResultsMode={hasCommittedSearch}
            mobileAction={mobileAction}
            query={query}
            onFocus={() => {
              markUserInteracted();
              setDropdownDismissed(false);
              setIsInputFocused(true);
            }}
            onBlur={() => setIsInputFocused(false)}
            onValueChange={value => {
              if (isInputFocused) {
                markUserInteracted();
              }
              setDropdownDismissed(false);
              setQuery(value);
              clearActiveSelection();
              if (!value.trim()) {
                exitCommittedSearch();
              }
            }}
            onKeyDown={handleInputKeyDown}
            onBackToSuggestions={returnToLiveSearch}
          />

          <SearchBoxPopover open={showDropdown}>
            {showResultsPanel ? (
              <SearchResultsPanel
                results={visibleSearchResults}
                loading={resultsPanelLoading}
                requestError={searchRequestError}
                selectedResultIndex={activeResultIndex}
                emptyMessage={
                  hasCommittedSearch
                    ? 'No matching results.'
                    : 'No matching results yet.'
                }
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
              showSearchLatency={liveDataEnabled || hasCommittedSearch}
              usingFallback={usingFallback}
            />
          </SearchBoxPopover>
          <SearchFeedbackDialog
            open={feedbackDialogOpen}
            onOpenChange={setFeedbackDialogOpen}
            onSubmit={note => {
              reportFeedback(
                showResultsPanel ? 'search' : 'autocomplete',
                note
              );
              setFeedbackDialogOpen(false);
            }}
          />
        </Command>
      </div>
    </div>
  );
}
