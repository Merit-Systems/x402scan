import type { OgObject } from 'open-graph-scraper/types';
import { scrapeMetadata } from './metadata';
import { scrapeOg } from './og';
import { scrapeFaviconWithFallback } from './favicon';

export const scrapeOriginData = async (inputOrigin: string) => {
  let origin = inputOrigin;

  // Scrape OG, metadata, and high-quality favicon in parallel
  let [og, metadata, favicon] = await Promise.all([
    scrapeOg(origin).catch(() => null),
    scrapeMetadata(origin).catch(() => null),
    scrapeFaviconWithFallback(origin).catch(() => null),
  ]);

  // Handle API subdomain fallback for OG and metadata
  if (origin.startsWith('https://api.')) {
    const baseOrigin = `https://${origin.slice(12)}`;

    // If OG data is missing, try the base domain
    if (
      !['ogTitle', 'ogDescription', 'ogImage'].some(
        key => og?.[key as keyof OgObject]
      )
    ) {
      og = await scrapeOg(baseOrigin).catch(() => null);
    }

    // If metadata is missing, try the base domain
    if (
      !metadata ||
      !(['title', 'description'] as const).some(key => key in (metadata ?? {}))
    ) {
      metadata = await scrapeMetadata(baseOrigin).catch(() => null);
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
