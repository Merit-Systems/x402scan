import z from 'zod';

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
import { formatTokenAmount } from '@/lib/token';
import { getOriginFromUrl } from '@/lib/url';
import { normalizeChainId } from '@/lib/x402';
import { checkEndpointSchema } from '@agentcash/discovery';

import type { AcceptsNetwork } from '@x402scan/scan-db/types';
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
      const check = await checkEndpointSchema({
        url: input.url,
        probe: true,
        signal: AbortSignal.timeout(10000),
      });

      if (!check.found) {
        return {
          error: true as const,
          parseErrors: ['Endpoint not found'],
          data: null,
        };
      }

      for (const advisory of check.advisories) {
        const x402Options = toX402PaymentOptions(advisory.paymentOptions ?? []);
        if (x402Options.length === 0) continue;

        const origin = getOriginFromUrl(input.url);
        const { og, metadata, favicon } = await scrapeOriginData(origin);

        await upsertOrigin({
          origin,
          title: metadata?.title ?? og?.ogTitle,
          description: metadata?.description ?? og?.ogDescription,
          favicon: favicon ?? undefined,
          ogImages:
            og?.ogImage?.map((image: ImageObject) => ({
              url: image.url,
              height: image.height,
              width: image.width,
              title: og.ogTitle,
              description: og.ogDescription,
            })) ?? [],
        });

        const normalizedAccepts = x402Options.map(opt => ({
          scheme: (opt.scheme ?? 'exact') as 'exact',
          network: normalizeChainId(opt.network).replace(
            '-',
            '_'
          ) as AcceptsNetwork,
          maxAmountRequired:
            ('amount' in opt ? opt.amount : opt.maxAmountRequired) ?? '0',
          payTo: opt.payTo ?? '',
          asset: opt.asset,
          maxTimeoutSeconds: opt.maxTimeoutSeconds ?? 60,
        }));

        const resource = await upsertResource({
          resource: input.url.toString(),
          type: 'http',
          x402Version: x402Options[0]!.version,
          lastUpdated: new Date(),
          accepts: normalizedAccepts.map(accept => ({
            ...accept,
            network: accept.network as AcceptsNetwork,
          })),
        });

        if (!resource) continue;

        if (advisory.paymentRequiredBody) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await upsertResourceResponse(resource.resource.id, advisory.paymentRequiredBody as any);
        }

        return {
          error: false as const,
          resource,
          accepts: resource.accepts.map(accept => ({
            ...accept,
            maxAmountRequired: formatTokenAmount(accept.maxAmountRequired),
          })),
          response: advisory.paymentRequiredBody,
        };
      }

      return {
        error: true as const,
        parseErrors: ['No 402 response or no x402 payment options'],
        data: null,
      };
    }),
});
