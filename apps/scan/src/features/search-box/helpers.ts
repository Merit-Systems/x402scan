import type { KeyboardEvent } from 'react';

import { normalizeAutocompleteText } from './matching';
import type { AutocompleteSuggestion } from './types';

export function getHostname(originUrl: string) {
  try {
    return new URL(originUrl).hostname;
  } catch {
    return originUrl;
  }
}

export function getSuggestionKey(suggestion: AutocompleteSuggestion) {
  return [
    suggestion.source,
    normalizeAutocompleteText(suggestion.originUrl),
    normalizeAutocompleteText(suggestion.text),
  ].join(':');
}

export function formatLatency(latencyMs: number) {
  return `${latencyMs.toLocaleString('en-US')}ms`;
}

export function isTextEditingKey(event: KeyboardEvent<HTMLInputElement>) {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return false;
  }

  return (
    event.key.length === 1 ||
    event.key === 'Backspace' ||
    event.key === 'Delete'
  );
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

export function getPrimaryProtocol(protocols: string[]) {
  if (protocols.includes('mpp')) return 'mpp';
  if (protocols.includes('x402')) return 'x402';
  return protocols[0] ?? null;
}
