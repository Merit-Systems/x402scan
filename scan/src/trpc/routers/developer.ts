import z from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

import { getOriginFromUrl } from '@/lib/url';
import { scrapeOriginData } from '@/services/scraper';

export const developerRouter = createTRPCRouter({
  preview: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .query(async ({ input }) => {
      // Strip query params to mirror registration flow
      const urlObj = new URL(input.url);
      urlObj.search = '';
      const cleanUrl = urlObj.toString();

      const origin = getOriginFromUrl(cleanUrl);
      const {
        og,
        metadata,
        origin: scrapedOrigin,
      } = await scrapeOriginData(origin);

      const title = metadata?.title ?? og?.ogTitle ?? null;
      const description = metadata?.description ?? og?.ogDescription ?? null;
      const favicon = og?.favicon
        ? og.favicon.startsWith('/')
          ? scrapedOrigin.replace(/\/$/, '') + og.favicon
          : og.favicon
        : null;
      const ogImages = (og?.ogImage ?? []).map(image => ({
        url: image.url,
        height: image.height,
        width: image.width,
        title: og?.ogTitle,
        description: og?.ogDescription,
      }));

      return {
        preview: {
          title,
          description,
          favicon,
          ogImages,
          origin: scrapedOrigin,
        },
      };
    }),
});
