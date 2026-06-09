const FETCH_TIMEOUT_MS = 5000;

/**
 * Fetch with timeout to prevent hanging on slow servers
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Fetches HTML from a URL with timeout and proper headers
 * Returns null if the request fails or returns non-OK status
 */
export const fetchHtml = async (url: string): Promise<string | null> => {
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; x402scan/1.0; +https://x402.org)',
      },
    });

    if (!res.ok) return null;

    return await res.text();
  } catch {
    return null;
  }
};
