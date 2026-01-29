import z from 'zod';

import {
  safeGetPaymentSettlement,
  safeWrapFetchWithPayment,
} from '@/shared/neverthrow/x402';
import { safeParseResponse } from '@/shared/neverthrow/fetch';
import { getState } from '@/shared/state';

import { mcpError, mcpErrorFetch, mcpSuccessResponse } from './response';

import { getOriginData } from '../lib/origin-data';

import { buildRequest } from './lib/request';

import { tokenStringToNumber } from '@/shared/token';

import type { JSONSchema } from 'zod/v4/core';
import type { RegisterTools } from '../types';

export const registerFetchOriginTool: RegisterTools = async ({
  server,
  account,
  flags,
  sessionId,
}) => {
  const { origins } = getState();

  await Promise.all(
    origins.map(async origin => {
      const surface = `${origin}-fetch`;

      const originData = await getOriginData({ origin, surface });

      if (!originData) {
        return;
      }

      const { hostname, resources, metadata } = originData;

      // Skip tool registration if no valid results
      if (resources.length === 0) {
        return;
      }

      const unionMembers = resources.map(({ resource, inputSchema }) =>
        z.object({
          url: z
            .literal(resource.resource)
            .describe(resource.paymentRequired.resource.description),
          method: z.literal(resource.method),
          ...('body' in inputSchema.properties
            ? {
                body: z.fromJSONSchema(
                  inputSchema.properties.body as JSONSchema.Schema
                ),
              }
            : {}),
          ...('query' in inputSchema.properties
            ? {
                queryParams: z.fromJSONSchema(
                  inputSchema.properties.query as JSONSchema.Schema
                ),
              }
            : {}),
          ...('headers' in inputSchema.properties
            ? {
                headers: z.fromJSONSchema(
                  inputSchema.properties.headers as JSONSchema.Schema
                ),
              }
            : {}),
        })
      );

      const requestSchema = z.discriminatedUnion(
        'url',
        unionMembers as [
          (typeof unionMembers)[number],
          ...(typeof unionMembers)[number][],
        ]
      );

      const site = hostname.split('.')[0]!;

      server.registerTool(
        site,
        {
          title: metadata?.title ?? undefined,
          description:
            metadata?.description ?? 'Make x402 requests to the origin',
          inputSchema: z.object({
            request: z
              .union([z.string(), requestSchema])
              .refine(value =>
                typeof value === 'string'
                  ? requestSchema.safeParse(JSON.parse(value)).success
                  : true
              )
              .transform(value =>
                typeof value === 'string'
                  ? requestSchema.parse(JSON.parse(value))
                  : value
              ),
          }),
        },
        async ({ request }) => {
          const fetchWithPay = safeWrapFetchWithPayment({
            account,
            server,
            surface: origin,
            flags,
          });

          const url = new URL(request.url);
          if (request.queryParams) {
            for (const [key, value] of Object.entries(request.queryParams)) {
              if (typeof value === 'string') {
                url.searchParams.set(key, value);
              } else {
                url.searchParams.set(key, JSON.stringify(value));
              }
            }
          }

          const headers: Record<string, string> = {};
          if (request.headers) {
            for (const [key, value] of Object.entries(request.headers)) {
              if (typeof value === 'string') {
                headers[key] = value;
              }
            }
          }

          const fetchResult = await fetchWithPay(
            buildRequest({
              input: {
                url: url.toString(),
                method: request.method as
                  | 'GET'
                  | 'POST'
                  | 'PUT'
                  | 'DELETE'
                  | 'PATCH',
                body: request.body,
                headers,
              },
              address: account.address,
              sessionId,
            })
          );

          if (fetchResult.isErr()) {
            return mcpError(fetchResult);
          }

          const { response, paymentPayload } = fetchResult.value;

          if (!response.ok) {
            return mcpErrorFetch(origin, response);
          }

          const parseResponseResult = await safeParseResponse(origin, response);

          if (parseResponseResult.isErr()) {
            return mcpError(parseResponseResult);
          }

          const settlementResult = safeGetPaymentSettlement(origin, response);

          return mcpSuccessResponse(
            parseResponseResult.value,

            settlementResult.isOk() || paymentPayload !== undefined
              ? {
                  ...(paymentPayload !== undefined
                    ? {
                        price: tokenStringToNumber(
                          paymentPayload.accepted.amount
                        ).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }),
                      }
                    : {}),
                  ...(settlementResult.isOk()
                    ? {
                        payment: {
                          success: settlementResult.value.success,
                          transactionHash: settlementResult.value.transaction,
                        },
                      }
                    : {}),
                }
              : undefined
          );
        }
      );
    })
  );
};
