import type {
  AutocompleteSuggestion,
  SearchBoxCandidateSnapshot,
  SearchBoxFeedbackContext,
  SearchBoxSelectionContext,
  SearchBoxTelemetryPipeline,
  SearchPreviewResult,
} from './types';

function snapshotAutocompleteSuggestions(
  suggestions: AutocompleteSuggestion[]
): SearchBoxCandidateSnapshot[] {
  return suggestions.slice(0, 50).map((suggestion, index) => ({
    kind: 'suggestion',
    rank: index,
    text: suggestion.text,
    source: suggestion.source,
    originTitle: suggestion.originTitle,
    originUrl: suggestion.originUrl,
    x402OriginId: suggestion.x402OriginId,
    mppOriginId: suggestion.mppOriginId,
    score: suggestion.score,
  }));
}

function snapshotSearchResults(
  results: SearchPreviewResult[]
): SearchBoxCandidateSnapshot[] {
  return results.slice(0, 50).map((result, index) => ({
    kind: 'result',
    rank: index,
    title: result.title,
    resourceId: result.resourceId,
    method: result.method,
    path: result.path,
    originTitle: result.originTitle,
    originUrl: result.originUrl,
    x402OriginId: result.x402OriginId,
    mppOriginId: result.mppOriginId,
  }));
}

function buildSelectionContext({
  autocompleteLatencyMs,
  candidates,
  pipeline,
  query,
  searchLatencyMs,
  selectedIndex,
}: Omit<SearchBoxSelectionContext, 'selectedCandidate'>) {
  const selectedCandidate = candidates[selectedIndex];
  // Data can refresh between keyboard/mouse selection and telemetry assembly.
  // If that race ever happens, drop the event instead of logging a bad match.
  if (!selectedCandidate) return null;

  return {
    autocompleteLatencyMs,
    candidates,
    pipeline,
    query,
    searchLatencyMs,
    selectedCandidate,
    selectedIndex,
  };
}

interface SearchBoxTelemetryReporterInput {
  autocompleteLatencyMs: number | null;
  query: string;
  searchLatencyMs: number | null;
  searchResults: SearchPreviewResult[];
  suggestions: AutocompleteSuggestion[];
}

export function useSearchBoxTelemetryReporter({
  autocompleteLatencyMs,
  query,
  searchLatencyMs,
  searchResults,
  suggestions,
}: SearchBoxTelemetryReporterInput) {
  const trimmedQuery = query.trim();

  function snapshotCandidates(pipeline: SearchBoxTelemetryPipeline) {
    return pipeline === 'autocomplete'
      ? snapshotAutocompleteSuggestions(suggestions)
      : snapshotSearchResults(searchResults);
  }

  return {
    reportFeedback(
      pipeline: SearchBoxTelemetryPipeline,
      feedbackNote?: string
    ): SearchBoxFeedbackContext {
      return {
        autocompleteLatencyMs,
        candidates: snapshotCandidates(pipeline),
        feedbackNote,
        pipeline,
        query: trimmedQuery,
        searchLatencyMs,
      };
    },
    reportSelection(
      pipeline: SearchBoxTelemetryPipeline,
      selectedIndex: number
    ) {
      return buildSelectionContext({
        autocompleteLatencyMs,
        candidates: snapshotCandidates(pipeline),
        pipeline,
        query: trimmedQuery,
        searchLatencyMs,
        selectedIndex,
      });
    },
  };
}
