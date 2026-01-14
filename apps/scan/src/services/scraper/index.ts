import type { OgObject } from 'open-graph-scraper/types';
import { fetchHtml } from './html';
import { parseMetadataFromHtml } from './metadata';
import { parseOgFromHtml } from './og';
import { parseFaviconFromHtml } from './favicon';

/**
 * Parses all data (OG, metadata, favicon) from an HTML string
 */
const parseAllFromHtml = async (html: string, origin: string) => {
  const [og, metadata, favicon] = await Promise.all([
    parseOgFromHtml(html).catch(() => null),
    Promise.resolve(parseMetadataFromHtml(html)).catch(() => null),
    parseFaviconFromHtml(html, origin).catch(() => null),
  ]);

  return { og, metadata, favicon };
};

/**
 * Checks if OG data has meaningful content
 */
const hasOgData = (og: OgObject | null): boolean => {
  if (!og) return false;
  return ['ogTitle', 'ogDescription', 'ogImage'].some(
    key => og[key as keyof OgObject]
  );
};

/**
 * Checks if metadata has meaningful content
 */
const hasMetadata = (
  metadata: { title?: string; description?: string } | null
): boolean => {
  if (!metadata) return false;
  return Boolean(metadata.title ?? metadata.description);
};

/**
 * Scrapes origin data with a single HTTP request per origin
 * Falls back to base domain for API subdomains if data is missing
 */
export const scrapeOriginData = async (inputOrigin: string) => {
  let origin = inputOrigin;

  // Fetch HTML once for the input origin
  const html = await fetchHtml(origin);

  // Parse all data from HTML (or return nulls if fetch failed)
  let { og, metadata, favicon } = html
    ? await parseAllFromHtml(html, origin)
    : { og: null, metadata: null, favicon: null };

  // Handle API subdomain fallback
  if (origin.startsWith('https://api.')) {
    const baseOrigin = `https://${origin.slice(12)}`;
    const needsOg = !hasOgData(og);
    const needsMetadata = !hasMetadata(metadata);
    const needsFavicon = !favicon;

    // If any data is missing, fetch the base domain
    if (needsOg || needsMetadata || needsFavicon) {
      const baseHtml = await fetchHtml(baseOrigin);

      if (baseHtml) {
        const baseData = await parseAllFromHtml(baseHtml, baseOrigin);

        // Fill in missing data from base domain
        if (needsOg && hasOgData(baseData.og)) {
          og = baseData.og;
        }
        if (needsMetadata && hasMetadata(baseData.metadata)) {
          metadata = baseData.metadata;
        }
        if (needsFavicon && baseData.favicon) {
          favicon = baseData.favicon;
        }
      }
    }

    // Update origin to base for URL resolution
    origin = baseOrigin;
  }

  return {
    og,
    metadata,
    origin,
    favicon,
  };
};
