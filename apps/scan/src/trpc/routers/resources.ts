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
  paymentRequirementsSchema,
  parseX402Response,
  normalizePaymentRequirement,
  isV2Response,
  type PaymentRequirements,
} from '@/lib/x402';
import { formatTokenAmount } from '@/lib/token';
import { getOriginFromUrl } from '@/lib/url';

import { Methods } from '@/types/x402';

import type { AcceptsNetwork } from '@x402scan/scan-db';
import { x402ResponseSchema } from 'x402/types';
import { getFaviconUrl } from '@/lib/favicon';
import type { ImageObject } from 'open-graph-scraper/types';

export const resourcesRouter = createTRPCRouter({
  list: {
    all: publicProcedure.query(async () => {
      return await listResources({});
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
            accepts: z3.array(paymentRequirementsSchema).optional(),
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

        // Parse enhanced response to get resourceInfo for v2
        const parsedResponse = parseX402Response(data);
        const resourceInfo = parsedResponse.success && isV2Response(parsedResponse.data)
          ? parsedResponse.data.resourceInfo
          : undefined;

        // upsert the resource - normalize accepts for both v1 and v2
        const accepts = baseX402ParsedResponse.data.accepts ?? [];
        const normalizedAccepts = accepts.map((accept: PaymentRequirements) =>
          normalizePaymentRequirement(accept, resourceInfo)
        );
        const resource = await upsertResource({
          resource: input.url.toString(),
          type: 'http',
          x402Version: baseX402ParsedResponse.data.x402Version,
          lastUpdated: new Date(),
          accepts: normalizedAccepts.map(accept => ({
            ...accept,
            network: accept.network!.replace('-', '_') as AcceptsNetwork,
          })),
        });

        if (!resource) {
          continue;
        }

        // store the response
        let enhancedParseWarnings: string[] | null = null;
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
