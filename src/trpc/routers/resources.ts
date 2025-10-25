import z from 'zod';
import z3 from 'zod3';

import { createTRPCRouter, publicProcedure } from '../trpc';

import { scrapeOriginData } from '@/services/scraper';
import {
  getResourceByAddress,
  listResources,
  searchResources,
  searchResourcesSchema,
  upsertResource,
} from '@/services/db/resources/resource';
import { upsertOrigin } from '@/services/db/resources/origin';
import { upsertResourceResponse } from '@/services/db/resources/response';

import { mixedAddressSchema } from '@/lib/schemas';
import {
  EnhancedPaymentRequirementsSchema,
  parseX402Response,
  type EnhancedPaymentRequirements,
} from '@/lib/x402/schema';
import { formatTokenAmount } from '@/lib/token';
import { getOriginFromUrl } from '@/lib/url';

import { Methods } from '@/types/x402';

import type { AcceptsNetwork } from '@prisma/client';
import { x402ResponseSchema } from 'x402/types';
import { getFaviconUrl } from '@/lib/favicon';
import type { ImageObject } from 'open-graph-scraper/types';

export const resourcesRouter = createTRPCRouter({
  list: {
    all: publicProcedure.query(async () => {
      return await listResources();
    }),
    byAddress: publicProcedure
      .input(mixedAddressSchema)
      .query(async ({ input }) => {
        return await listResources({
          accepts: {
            some: {
              payTo: input.toLowerCase(),
            },
          },
        });
      }),
  },
  getResourceByAddress: publicProcedure
    .input(mixedAddressSchema)
    .query(async ({ input }) => {
      return await getResourceByAddress(input);
    }),
  search: publicProcedure
    .input(searchResourcesSchema)
    .query(async ({ input }) => {
      return await searchResources(input);
    }),

  register: publicProcedure
    .input(
      z.object({
        url: z.url(),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.object().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let parseErrorData: {
        parseErrors: string[];
        data: unknown;
      } | null = null;

      for (const method of [Methods.GET, Methods.POST]) {
        // ping resource
        const response = await fetch(input.url, {
          method,
          headers: input.headers,
          body: input.body ? JSON.stringify(input.body) : undefined,
        });

        // if it doesn't respond with a 402, return error
        if (response.status !== 402) {
          continue;
        }

        const data = (await response.json()) as unknown;

        const baseX402ParsedResponse = x402ResponseSchema
          .omit({
            error: true,
          })
          .extend({
            error: z3.string().optional(),
            accepts: z3.array(EnhancedPaymentRequirementsSchema).optional(),
          })
          .safeParse(data);
        if (!baseX402ParsedResponse.success) {
          console.error(baseX402ParsedResponse.error.issues);
          parseErrorData = {
            parseErrors: baseX402ParsedResponse.error.issues.map(
              issue => `${issue.path.join('.')}: ${issue.message}`
            ),
            data,
          };
          continue;
        }

        const origin = getOriginFromUrl(input.url);

        const {
          og,
          metadata,
          origin: scrapedOrigin,
        } = await scrapeOriginData(origin);

        await upsertOrigin({
          origin: origin,
          title: metadata?.title ?? og?.ogTitle,
          description: metadata?.description ?? og?.ogDescription,
          favicon: og?.favicon
            ? getFaviconUrl(og.favicon, scrapedOrigin)
            : undefined,
          ogImages:
            og?.ogImage?.map((image: ImageObject) => ({
              url: image.url,
              height: image.height,
              width: image.width,
              title: og.ogTitle,
              description: og.ogDescription,
            })) ?? [],
        });

        // upsert the resource
        const accepts = baseX402ParsedResponse.data.accepts ?? [];
        const resource = await upsertResource({
          resource: input.url.toString(),
          type: 'http',
          x402Version: baseX402ParsedResponse.data.x402Version,
          lastUpdated: new Date(),
          accepts: accepts.map((accept: EnhancedPaymentRequirements) => ({
            ...accept,
            network: (accept.network as string).replace(
              '-',
              '_'
            ) as AcceptsNetwork,
            maxAmountRequired: accept.maxAmountRequired,
            outputSchema: accept.outputSchema!,
            extra: accept.extra,
          })),
        });

        if (!resource) {
          continue;
        }

        // parse the response
        let enhancedParseWarnings: string[] | null = null;
        const parsedResponse = parseX402Response(data);
        if (parsedResponse.success) {
          await upsertResourceResponse(
            resource.resource.id,
            parsedResponse.data
          );
        } else {
          enhancedParseWarnings = parsedResponse.errors;
        }

        return {
          error: false as const,
          resource,
          accepts: resource.accepts.map(accept => ({
            ...accept,
            maxAmountRequired: formatTokenAmount(accept.maxAmountRequired),
          })),
          enhancedParseWarnings,
          response: data,
        };
      }

      if (parseErrorData) {
        return {
          error: true as const,
          type: 'parseErrors' as const,
          parseErrorData,
        };
      }

      return {
        error: true as const,
        type: 'no402' as const,
      };
    }),
});
