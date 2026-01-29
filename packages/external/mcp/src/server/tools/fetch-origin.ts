import z from 'zod';

import {
  safeGetPaymentSettlement,
  safeWrapFetchWithPayment,
} from '@/shared/neverthrow/x402';
import { safeParseResponse } from '@/shared/neverthrow/fetch';
import { getState } from '@/shared/state';

import { mcpError, mcpErrorFetch, mcpSuccessResponse } from './response';

import { getInputSchema } from '../lib/x402-extensions';

import { buildRequest } from './lib/request';
import { fetchWellKnown } from './lib/fetch-well-known';
import { checkX402Endpoint } from './lib/check-x402-endpoint';

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
      const wellKnownResult = await fetchWellKnown({
        surface: origin,
        url: origin,
      });
      if (wellKnownResult.isErr()) {
        return;
      }
      const checkX402EndpointResults = await Promise.all(
        wellKnownResult.value.resources.map(async resource => {
          const checkX402EndpointResult = await checkX402Endpoint({
            surface: `${origin}-resource`,
            resource,
          });
          if (checkX402EndpointResult.isErr()) {
            return null;
          }
          return checkX402EndpointResult.value;
        })
      );
      const validResults = checkX402EndpointResults
        .filter(
          (result): result is NonNullable<typeof result> => result !== null
        )
        .map(resource => {
          const inputSchema = getInputSchema(
            resource.paymentRequired?.extensions
          );
          if (!inputSchema || !('body' in inputSchema.properties)) {
            return null;
          }
          return {
            resource,
            bodySchema: inputSchema?.properties.body as JSONSchema.Schema,
          };
        })
        .filter(
          (result): result is NonNullable<typeof result> => result !== null
        );

      // Skip tool registration if no valid results
      if (validResults.length === 0) {
        return;
      }

      const strippedOrigin = origin
        .replace('https://', '')
        .replace('http://', '');

      const unionMembers = validResults.map(({ resource, bodySchema }) =>
        z.object({
          url: z
            .literal(resource.resource)
            .describe(resource.paymentRequired.resource.description),
          method: z.literal(resource.method),
          body: z.fromJSONSchema(bodySchema),
        })
      );

      const requestSchema = z.discriminatedUnion(
        'url',
        unionMembers as [
          (typeof unionMembers)[number],
          ...(typeof unionMembers)[number][],
        ]
      );

      server.registerTool(
        strippedOrigin.replace('.', '-'),
        {
          title: origin,
          description: 'Fetch from origin',
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
        async input => {
          const fetchWithPay = safeWrapFetchWithPayment({
            account,
            server,
            surface: origin,
            flags,
          });

          const fetchResult = await fetchWithPay(
            buildRequest({
              input: {
                url: input.request.url,
                method: input.request.method as
                  | 'GET'
                  | 'POST'
                  | 'PUT'
                  | 'DELETE'
                  | 'PATCH',
                body: input.request.body,
                headers: {},
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
