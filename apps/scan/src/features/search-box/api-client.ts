import type {
  AutocompleteOutput,
  SearchBoxRequestOptions,
  SearchPreviewOutput,
  SearchProtocol,
} from './types';

function getServerProtocolFilter(protocols?: SearchProtocol[]) {
  // The server accepts one protocol filter. Undefined means "all protocols",
  // so ['x402', 'mpp'] intentionally omits the protocol query parameter.
  if (protocols?.length !== 1) return null;
  return protocols[0] ?? null;
}

function buildSearchBoxApiUrl(
  path: string,
  params: Record<string, string>,
  options: SearchBoxRequestOptions
) {
  const searchParams = new URLSearchParams(params);
  const protocol = getServerProtocolFilter(options.protocols);

  if (protocol) {
    searchParams.set('protocol', protocol);
  }

  return `${options.apiBaseUrl ?? ''}${path}?${searchParams.toString()}`;
}

function withObservedLatency<T extends { latencyMs: number }>(
  payload: T,
  startedAt: number
): T {
  // API responses can be CDN-cached; the component should display the
  // browser-observed round trip, not a cached server timing value.
  return {
    ...payload,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}

export async function requestAutocomplete({
  options = {},
  query,
  signal,
}: {
  query: string;
  options?: SearchBoxRequestOptions;
  signal?: AbortSignal;
}) {
  const startedAt = performance.now();
  const response = await fetch(
    buildSearchBoxApiUrl(
      '/api/search/autocomplete',
      {
        q: query,
        suggestions: '6',
        results: '0',
      },
      options
    ),
    {
      method: 'GET',
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`Autocomplete request failed with ${response.status}`);
  }

  return withObservedLatency(
    (await response.json()) as AutocompleteOutput,
    startedAt
  );
}

export async function requestSearch({
  options = {},
  query,
  signal,
}: {
  query: string;
  options?: SearchBoxRequestOptions;
  signal?: AbortSignal;
}) {
  const startedAt = performance.now();
  const response = await fetch(
    buildSearchBoxApiUrl(
      '/api/search/results',
      {
        q: query,
      },
      options
    ),
    {
      method: 'GET',
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`Search request failed with ${response.status}`);
  }

  return withObservedLatency(
    (await response.json()) as SearchPreviewOutput,
    startedAt
  );
}
