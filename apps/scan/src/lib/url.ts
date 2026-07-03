export const getOriginFromUrl = (url: string) => {
  return new URL(url).origin;
};

/**
 * Normalize a resource URL to the canonical form stored in the DB.
 * Applies URL-encoding (via the URL constructor) and strips the query string.
 * Both registerResource and the deprecation allow-list must use this so their
 * string comparisons agree.
 */
export const normalizeResourceUrl = (url: string): string => {
  const u = new URL(url);
  u.search = '';
  return u.toString();
};

/**
 * Normalize a URL for comparison by removing trailing slashes
 * and normalizing the path.
 *
 * @example
 * normalizeUrl('https://example.com/api/') // 'https://example.com/api'
 * normalizeUrl('https://example.com/api') // 'https://example.com/api'
 */
export const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Remove trailing slash from pathname (unless it's just "/")
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    // If URL parsing fails, return original string
    return url;
  }
};

/**
 * Check whether a concrete URL matches a discovered resource URL that may
 * contain OpenAPI path templates (e.g. /v1/candles/{coin}/{interval}).
 * Origins must match exactly; template segments ({...}) match any value.
 */
export function urlMatchesDiscoveredResource(
  inputUrl: string,
  discoveredUrl: string
): boolean {
  try {
    const input = new URL(inputUrl);
    const discovered = new URL(discoveredUrl);

    if (input.origin !== discovered.origin) return false;

    const inputSegments = input.pathname.replace(/\/+$/, '').split('/');
    const discoveredSegments = discovered.pathname
      .replace(/\/+$/, '')
      .split('/');

    if (inputSegments.length !== discoveredSegments.length) return false;

    return discoveredSegments.every((seg, i) => {
      const decoded = decodeURIComponent(seg);
      return (
        (decoded.startsWith('{') && decoded.endsWith('}')) ||
        seg === inputSegments[i]
      );
    });
  } catch {
    return false;
  }
}
