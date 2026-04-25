'use client';

import { useRouter } from 'next/navigation';

import {
  SearchBox,
  type AutocompleteSuggestion,
  type SearchBoxFeedbackContext,
  type SearchBoxProps,
  type SearchBoxSelectionContext,
  type SearchPreviewResult,
} from '@/features/search-box';

const SEARCH_ANONYMOUS_SESSION_KEY = 'x402scan.search.anonymous_session_id';

function getAnonymousSessionId() {
  const fallbackId =
    window.crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  try {
    const existing = window.localStorage.getItem(SEARCH_ANONYMOUS_SESSION_KEY);
    if (existing) return existing;

    window.localStorage.setItem(SEARCH_ANONYMOUS_SESSION_KEY, fallbackId);
  } catch {
    // Storage can fail in private modes; telemetry still carries the event.
  }

  return fallbackId;
}

function postSearchEvent(path: string, payload: object) {
  void fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      anonymousSessionId: getAnonymousSessionId(),
    }),
    keepalive: true,
  }).catch(() => {
    // Search telemetry must not block navigation.
  });
}

function buildServerUrl(input: {
  x402OriginId: string | null;
  method?: string;
  path?: string;
}) {
  if (!input.x402OriginId) return null;

  const params =
    input.method && input.path
      ? `?resource=${encodeURIComponent(`${input.method} ${input.path}`)}`
      : '';

  return `/server/${encodeURIComponent(input.x402OriginId)}${params}` as const;
}

function logSelection(surface: string, context: SearchBoxSelectionContext) {
  postSearchEvent('/api/search/events/selection', {
    ...context,
    surface,
  });
}

function logFeedback(surface: string, context: SearchBoxFeedbackContext) {
  postSearchEvent('/api/search/events/feedback', {
    ...context,
    feedbackKind: 'bad_results',
    surface,
  });
}

export function X402LinkedSearchBox({
  enableKeyboardShortcut = false,
  surface,
  ...searchBoxProps
}: Pick<
  SearchBoxProps,
  | 'autoFocus'
  | 'demoQueries'
  | 'enableKeyboardShortcut'
  | 'initialAutocompleteCache'
  | 'layout'
  | 'previewMode'
  | 'showFeedbackControls'
> & {
  surface: string;
}) {
  const router = useRouter();

  function selectSuggestion(
    suggestion: AutocompleteSuggestion,
    context: SearchBoxSelectionContext
  ) {
    logSelection(surface, context);
    const url = buildServerUrl({ x402OriginId: suggestion.x402OriginId });
    if (url) router.push(url);
  }

  function selectResult(
    result: SearchPreviewResult,
    context: SearchBoxSelectionContext
  ) {
    logSelection(surface, context);
    const url = buildServerUrl({
      x402OriginId: result.x402OriginId,
      method: result.method,
      path: result.path,
    });
    if (url) router.push(url);
  }

  return (
    <SearchBox
      {...searchBoxProps}
      enableKeyboardShortcut={enableKeyboardShortcut}
      protocols={['x402']}
      showFeedbackControls
      onSelectSuggestion={selectSuggestion}
      onSelectResult={selectResult}
      onReportBadResults={context => logFeedback(surface, context)}
    />
  );
}
