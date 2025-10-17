import type { OgObject } from 'open-graph-scraper/types';
import { scrapeMetadata } from './metadata';
import { scrapeOg } from './og';
import { getFaviconUrl } from '@/lib/favicon';

export const scrapeOriginData = async (inputOrigin: string) => {
  let origin = inputOrigin;

  let [og, metadata] = await Promise.all([
    scrapeOg(origin).catch(() => {
      return null;
    }),
    scrapeMetadata(origin).catch(() => {
      return null;
    }),
  ]);

  if (origin.startsWith('https://api.')) {
    origin = `https://${origin.slice(12)}`;

    if (
      !['ogTitle', 'ogDescription', 'ogImage'].some(
        key => og?.[key as keyof OgObject]
      )
    ) {
      og = await scrapeOg(origin);
    } else {
      if (og?.favicon) {
        const faviconUrl = getFaviconUrl(og.favicon, inputOrigin);

        try {
          const res = await fetch(faviconUrl);
          if (res.status !== 200) {
            // try to get a favicon from the base origin
            const ogResponse = await scrapeOg(origin);

            if (ogResponse?.favicon) {
              try {
                const baseFaviconResponse = await fetch(
                  getFaviconUrl(ogResponse.favicon, origin)
                );
                if (baseFaviconResponse.status === 200) {
                  og = {
                    ...og,
                    favicon: getFaviconUrl(ogResponse.favicon, origin),
                  };
                }
              } catch {}
            }
          }
        } catch {
          // do nothing
        }
      }
    }

    if (
      !metadata ||
      !(['title', 'description'] as const).some(key => key in (metadata ?? {}))
    ) {
      metadata = await scrapeMetadata(origin);
    }
  }

  return {
    og,
    metadata,
    origin,
  };
};
