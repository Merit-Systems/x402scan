export const getOriginFromUrl = (url: string) => {
  return new URL(url).origin;
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
