export const getOriginFromUrl = (url: string): string => {
  const parsedUrl = safeParseUrl(url);
  if (!parsedUrl) {
    throw new Error(`Invalid URL provided to getOriginFromUrl: "${url}"`);
  }
  return parsedUrl.origin;
};

/**
 * Safely parses a URL string without throwing errors
 * Only accepts http and https URLs for security
 * @param url - The URL string to parse
 * @returns The parsed URL object or null if invalid
 */
export const safeParseUrl = (url: string): URL | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  const parsed = URL.parse(url);
  if (!parsed) {
    return null;
  }
  // Only accept http and https protocols for security
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }
  // Ensure we have a valid hostname
  if (!parsed.hostname) {
    return null;
  }
  return parsed;
};

/**
 * Safely gets the hostname from a URL string
 * @param url - The URL string to parse
 * @param fallback - Optional fallback value if URL is invalid
 * @returns The hostname or fallback value
 */
export const safeGetHostname = (
  url: string,
  fallback: string = 'Invalid URL'
): string => {
  const parsed = safeParseUrl(url);
  return parsed?.hostname ?? fallback;
};
