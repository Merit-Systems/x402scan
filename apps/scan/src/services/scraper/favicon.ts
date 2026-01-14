import { getFaviconUrl } from '@/lib/favicon';

interface IconCandidate {
  href: string;
  type: string | null;
  sizes: string | null;
  rel: string;
  priority: number;
  sizeValue: number;
}

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
 * Parses a sizes attribute (e.g., "96x96", "192x192") and returns the largest dimension
 */
const parseSizeValue = (sizes: string | null): number => {
  if (!sizes) return 0;

  // Handle "any" for SVG
  if (sizes === 'any') return Infinity;

  // Parse dimensions like "96x96", "192x192", or space-separated "48x48 96x96"
  const sizeMatches = sizes.match(/(\d+)x(\d+)/g);
  if (!sizeMatches) return 0;

  return Math.max(
    ...sizeMatches.map(size => {
      const [width] = size.split('x').map(Number);
      return width ?? 0;
    })
  );
};

/**
 * Determines the priority of an icon based on type and rel
 * Lower number = higher priority
 */
const getIconPriority = (
  rel: string,
  type: string | null,
  sizeValue: number
): number => {
  // Priority 1: SVG favicon (infinite resolution, best quality)
  if (type === 'image/svg+xml') return 1;

  // Priority 2: Large PNG favicon (96x96 or larger)
  if (type === 'image/png' && sizeValue >= 96) return 2;

  // Priority 3: Apple touch icon (typically 180x180)
  if (rel.includes('apple-touch-icon')) return 3;

  // Priority 4: Standard favicon with good size
  if (
    (rel === 'icon' || rel === 'shortcut icon') &&
    type === 'image/png' &&
    sizeValue > 0
  ) {
    return 4;
  }

  // Priority 5: Standard favicon without size info
  if (rel === 'icon' || rel === 'shortcut icon') return 5;

  // Priority 6: Any other icon link
  return 6;
};

/**
 * Extracts all icon candidates from HTML
 */
const extractIconCandidates = (html: string): IconCandidate[] => {
  const candidates: IconCandidate[] = [];

  // Match all link tags with rel containing "icon"
  const linkRegex =
    /<link\s+([^>]*(?:rel\s*=\s*["'][^"']*icon[^"']*["'][^>]*))>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const attrs = match[1]!;

    // Extract href
    const hrefMatch = attrs.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const href = hrefMatch[1]!;

    // Extract rel
    const relMatch = attrs.match(/rel\s*=\s*["']([^"']+)["']/i);
    const rel = relMatch?.[1]?.toLowerCase() ?? 'icon';

    // Extract type
    const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/i);
    const type = typeMatch?.[1]?.toLowerCase() ?? null;

    // Extract sizes
    const sizesMatch = attrs.match(/sizes\s*=\s*["']([^"']+)["']/i);
    const sizes = sizesMatch?.[1] ?? null;

    const sizeValue = parseSizeValue(sizes);
    const priority = getIconPriority(rel, type, sizeValue);

    candidates.push({
      href,
      type,
      sizes,
      rel,
      priority,
      sizeValue,
    });
  }

  return candidates;
};

/**
 * Sorts candidates by priority (lower is better), then by size (larger is better)
 */
const sortCandidates = (candidates: IconCandidate[]): IconCandidate[] => {
  return [...candidates].sort((a, b) => {
    // First sort by priority (lower is better)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Within same priority, prefer larger sizes
    return b.sizeValue - a.sizeValue;
  });
};

/**
 * Checks if a favicon URL is accessible
 * Tries HEAD first, falls back to GET if HEAD fails (some servers don't support HEAD)
 */
const checkFaviconExists = async (url: string): Promise<boolean> => {
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

/**
 * Scrapes the best quality favicon from a URL
 * Priority order:
 * 1. SVG favicon (<link rel="icon" type="image/svg+xml">)
 * 2. Large PNG favicon (<link rel="icon" type="image/png"> with sizes >= 96)
 * 3. Apple touch icon (<link rel="apple-touch-icon">)
 * 4. Standard favicon (<link rel="icon"> or <link rel="shortcut icon">)
 * 5. Default /favicon.ico
 */
export const scrapeFavicon = async (origin: string): Promise<string | null> => {
  try {
    const res = await fetchWithTimeout(origin, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; x402scan/1.0; +https://x402.org)',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const candidates = extractIconCandidates(html);
    const sortedCandidates = sortCandidates(candidates);

    // Try each candidate in priority order until one works
    for (const candidate of sortedCandidates) {
      const faviconUrl = getFaviconUrl(candidate.href, origin);

      if (await checkFaviconExists(faviconUrl)) {
        return faviconUrl;
      }
    }

    // Fallback to /favicon.ico
    const fallbackUrl = new URL('/favicon.ico', origin).toString();
    if (await checkFaviconExists(fallbackUrl)) {
      return fallbackUrl;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Scrapes favicon with subdomain fallback logic
 * If the origin is an API subdomain, tries the base domain as fallback
 */
export const scrapeFaviconWithFallback = async (
  inputOrigin: string
): Promise<string | null> => {
  // First try the input origin
  let favicon = await scrapeFavicon(inputOrigin);

  if (favicon) {
    return favicon;
  }

  // If it's an API subdomain, try the base domain
  if (inputOrigin.startsWith('https://api.')) {
    const baseOrigin = `https://${inputOrigin.slice(12)}`;
    favicon = await scrapeFavicon(baseOrigin);

    if (favicon) {
      return favicon;
    }
  }

  return null;
};
