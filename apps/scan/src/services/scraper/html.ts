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

/**
 * Checks if a URL is accessible (returns 200)
 * Tries HEAD first, falls back to GET if HEAD fails
 */
export const checkUrlExists = async (url: string): Promise<boolean> => {
  try {
    // Try HEAD first (more efficient)
    const headRes = await fetchWithTimeout(url, { method: 'HEAD' });
    if (headRes.status === 200) return true;

    // Some servers return 405 Method Not Allowed for HEAD, try GET
    if (headRes.status === 405 || headRes.status === 403) {
      const getRes = await fetchWithTimeout(url, { method: 'GET' });
      return getRes.status === 200;
    }

    return false;
  } catch {
    return false;
  }
};
