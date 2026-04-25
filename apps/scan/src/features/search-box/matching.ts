import type { AutocompleteOutput } from './types';

export function normalizeAutocompleteText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function scoreAutocompleteLexical(query: string, text: string) {
  const normalizedQuery = normalizeAutocompleteText(query);
  const normalizedText = normalizeAutocompleteText(text);

  if (!normalizedQuery || !normalizedText) return 0;
  if (normalizedText === normalizedQuery) return 320;
  if (normalizedText.startsWith(normalizedQuery)) return 260;
  if (normalizedText.includes(` ${normalizedQuery}`)) return 220;
  if (normalizedText.includes(normalizedQuery)) return 140;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const textTokens = normalizedText.split(' ').filter(Boolean);
  const tokenMatches = queryTokens.reduce((count, token) => {
    return count + Number(textTokens.some(word => word.startsWith(token)));
  }, 0);

  return tokenMatches > 0 ? tokenMatches * 48 : 0;
}

function matchesAutocompleteQuery(text: string, query: string) {
  return scoreAutocompleteLexical(query, text) > 0;
}

function filterAutocompleteResponse(
  data: AutocompleteOutput,
  query: string
): AutocompleteOutput {
  const normalizedQuery = normalizeAutocompleteText(query);

  return {
    ...data,
    query: normalizedQuery,
    suggestions: data.suggestions.filter(suggestion =>
      matchesAutocompleteQuery(suggestion.text, normalizedQuery)
    ),
    results: data.results.filter(result => {
      const haystack = normalizeAutocompleteText(
        `${result.matchText} ${result.summary} ${result.path} ${result.originTitle}`
      );
      return haystack.includes(normalizedQuery);
    }),
  };
}

export function getClosestCachedResponse(
  cache: Map<string, AutocompleteOutput>,
  query: string
) {
  for (let length = query.length - 1; length >= 1; length -= 1) {
    const prefix = query.slice(0, length);
    const cached = cache.get(prefix);
    if (!cached) continue;

    const filtered = filterAutocompleteResponse(cached, query);
    if (filtered.suggestions.length > 0 || filtered.results.length > 0) {
      return filtered;
    }
  }

  return null;
}

export function getLikelyNextPrefixes(data: AutocompleteOutput, query: string) {
  const normalizedQuery = normalizeAutocompleteText(query);
  const weights = new Map<string, number>();

  for (const suggestion of data.suggestions.slice(0, 6)) {
    const normalizedText = normalizeAutocompleteText(suggestion.text);
    if (
      !normalizedText.startsWith(normalizedQuery) ||
      normalizedText.length <= normalizedQuery.length
    ) {
      continue;
    }

    let nextLength = normalizedQuery.length + 1;
    if (
      normalizedText.charAt(normalizedQuery.length) === ' ' &&
      normalizedText.length > normalizedQuery.length + 1
    ) {
      nextLength += 1;
    }

    const nextPrefix = normalizedText.slice(0, nextLength);
    weights.set(
      nextPrefix,
      (weights.get(nextPrefix) ?? 0) + Math.max(suggestion.score, 1)
    );
  }

  return [...weights.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([prefix]) => prefix);
}
