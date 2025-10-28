/**
 * Extract hostname from origin URL
 */
export function getHostnameFromOrigin(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin;
  }
}

