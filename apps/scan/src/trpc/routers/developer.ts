import z from 'zod';

import { createTRPCRouter, publicProcedure } from '../trpc';

import { getOriginFromUrl } from '@/lib/url';
import { parseX402Response, getOutputSchema } from '@/lib/x402';
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
        ? new URL(og.favicon, scrapedOrigin).toString()
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
  test: publicProcedure
    .input(
      z.object({
        method: z.enum(['GET', 'POST']),
        url: z.string().url(),
        headers: z.record(z.string(), z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      const { method, url, headers = {} } = input;

      const response = await fetch(url, {
        method,
        headers:
          method === 'POST'
            ? { ...headers, 'Content-Type': 'application/json' }
            : headers,
        body: method === 'POST' ? '{}' : undefined,
        redirect: 'follow',
      });

      const text = await response.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }

      const hdrs: Record<string, string> = {};
      response.headers.forEach((v, k) => (hdrs[k] = v));

      // Try to extract x402 data from Payment-Required header first, then body
      let x402Data: unknown = body;
      const paymentRequiredHeader = response.headers.get('Payment-Required');
      if (paymentRequiredHeader) {
        try {
          const decoded = Buffer.from(paymentRequiredHeader, 'base64').toString(
            'utf-8'
          );
          x402Data = JSON.parse(decoded);
        } catch {
          // Fall back to body if header parsing fails
        }
      }

      // Use x402Data for the result body so UI displays it correctly
      const result = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: hdrs,
        body: x402Data,
      };

      const parsed = parseX402Response(x402Data);
      const info = (() => {
        if (!parsed?.success)
          return { hasAccepts: false, hasInputSchema: false };
        const accepts = parsed.data.accepts ?? [];
        const hasAccepts = accepts.length > 0;
        const outputSchema = getOutputSchema(parsed.data);
        const hasInputSchema = Boolean(outputSchema?.input);
        return { hasAccepts, hasInputSchema };
      })();

      return { result, parsed, info };
    }),
});
