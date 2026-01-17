/**
 * Resolves a favicon href to an absolute URL
 * Handles: absolute URLs, protocol-relative URLs, root-relative paths, and relative paths
 */
export const getFaviconUrl = (favicon: string, origin: string): string => {
  // Already absolute URL (http:// or https://)
  if (favicon.startsWith('http://') || favicon.startsWith('https://')) {
    return favicon;
  }

  // Protocol-relative URL (//cdn.example.com/...)
  if (favicon.startsWith('//')) {
    return `https:${favicon}`;
  }

  // Root-relative path (/favicon.ico)
  if (favicon.startsWith('/')) {
    return origin.replace(/\/$/, '') + favicon;
  }

  // Relative path (images/favicon.ico) - resolve relative to origin root
  return origin.replace(/\/$/, '') + '/' + favicon;
};
