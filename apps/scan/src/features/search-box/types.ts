export type SearchProtocol = 'x402' | 'mpp';

export type SearchBoxPreviewMode = 'animated' | 'off';

export type SearchBoxLayout = 'page' | 'section';

export type SearchBoxTelemetryPipeline = 'autocomplete' | 'search';

export type AutocompleteSuggestionSource =
  | 'keyword'
  | 'providerAlias'
  | 'useCase';

export interface SearchBoxRequestOptions {
  apiBaseUrl?: string;
  protocols?: SearchProtocol[];
}

export interface AutocompleteSuggestion {
  text: string;
  source: AutocompleteSuggestionSource;
  originTitle: string;
  originUrl: string;
  favicon: string;
  x402OriginId: string | null;
  mppOriginId: string | null;
  score: number;
}

export interface AutocompleteResult {
  resourceId: string;
  method: string;
  path: string;
  summary: string;
  matchText: string;
  originTitle: string;
  originUrl: string;
  favicon: string;
  x402OriginId: string | null;
  mppOriginId: string | null;
}

export interface AutocompleteOutput {
  query: string;
  latencyMs: number;
  suggestions: AutocompleteSuggestion[];
  results: AutocompleteResult[];
}

export type AutocompleteCacheSnapshot = Record<string, AutocompleteOutput>;

export interface SearchPreviewResult {
  resourceId: string;
  method: string;
  path: string;
  title: string;
  facets: string[];
  authMode: string | null;
  price: string | null;
  protocols: string[];
  originTitle: string;
  originUrl: string;
  favicon: string;
  x402OriginId: string | null;
  mppOriginId: string | null;
}

export interface SearchPreviewOutput {
  query: string;
  latencyMs: number;
  results: SearchPreviewResult[];
  page: number;
  totalResults: number;
}

export interface SearchBoxCandidateSnapshot {
  kind: 'suggestion' | 'result';
  rank: number;
  text?: string;
  title?: string;
  source?: string;
  resourceId?: string;
  method?: string;
  path?: string;
  originTitle: string;
  originUrl: string;
  x402OriginId: string | null;
  mppOriginId: string | null;
  score?: number;
}

export interface SearchBoxSelectionContext {
  query: string;
  pipeline: SearchBoxTelemetryPipeline;
  selectedIndex: number;
  selectedCandidate: SearchBoxCandidateSnapshot;
  candidates: SearchBoxCandidateSnapshot[];
  autocompleteLatencyMs: number | null;
  searchLatencyMs: number | null;
}

export interface SearchBoxFeedbackContext {
  query: string;
  pipeline: SearchBoxTelemetryPipeline;
  candidates: SearchBoxCandidateSnapshot[];
  autocompleteLatencyMs: number | null;
  searchLatencyMs: number | null;
  feedbackNote?: string;
}
