import z from 'zod';

import { x402HTTPClient } from '@x402/core/client';
import { x402Client } from '@x402/core/client';
import { err, ok } from '@x402scan/neverthrow';

import { safeFetch, safeFetchJson } from '@/shared/neverthrow/fetch';
import { safeGetPaymentRequired } from '@/shared/neverthrow/x402';
import { safeStringifyJson } from '@/shared/neverthrow/json';

import { getWebPageMetadata } from './_lib';

import { getInputSchema } from '../lib/x402-extensions';

import { ORIGINS } from '@/shared/origins';

import type { RegisterResources } from './types';
import type { JsonObject } from '@/shared/neverthrow/json/types';

const surface = 'registerOrigins';

const wellKnownSchema = z.object({
  resources: z.array(z.string()),
});

export const registerOrigins: RegisterResources = async ({ server }) => {
  await Promise.all(
    ORIGINS.map(async origin => {
      // Extract domain from full URL (e.g., 'https://enrichx402.com' -> 'enrichx402.com')
      const domain = new URL(origin).hostname;
      const metadataResult = await getWebPageMetadata(origin);
      const metadata = metadataResult.isOk() ? metadataResult.value : null;
      server.registerResource(
        domain,
        `api://${domain}`,
        {
          title: metadata?.title ?? origin,
          description: metadata?.description ?? '',
          mimeType: 'application/json',
        },
        async uri => {
          const wellKnownUrl = `${uri.toString().replace('api://', 'https://')}/.well-known/x402`;
          const wellKnownResult = await safeFetchJson(
            surface,
            new Request(wellKnownUrl),
            wellKnownSchema
          );

          if (wellKnownResult.isErr()) {
            console.error(
              `Failed to fetch well-known for ${origin}:`,
              wellKnownResult.error
            );
            return {
              contents: [
                {
                  uri: domain,
                  text: JSON.stringify(
                    { error: 'Failed to fetch well-known resources' },
                    null,
                    2
                  ),
                  mimeType: 'application/json',
                },
              ],
            };
          }

          const resources = await Promise.all(
            wellKnownResult.value.resources.map(async resource => {
              const postResult = await getResourceResponse(
                resource,
                new Request(resource, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                })
              );

              if (postResult.isOk()) {
                return postResult.value;
              }

              const getResult = await getResourceResponse(
                resource,
                new Request(resource, { method: 'GET' })
              );

              if (getResult.isOk()) {
                return getResult.value;
              }

              console.error(`Failed to get resource response for ${resource}`);
              return null;
            })
          );

          const payload = {
            server: origin,
            name: metadata?.title,
            description: metadata?.description,
            resources: resources.filter(Boolean).map(resource => {
              if (!resource) return null;
              const schema = getInputSchema(
                resource.paymentRequired?.extensions
              );

              return {
                url: resource.resource,
                schema,
                mimeType: resource.paymentRequired.resource.mimeType,
              };
            }),
          };

          const stringifyResult = safeStringifyJson(
            surface,
            payload as JsonObject
          );

          if (stringifyResult.isErr()) {
            console.error(
              `Failed to stringify response for ${origin}:`,
              stringifyResult.error
            );
            return {
              contents: [
                {
                  uri: domain,
                  text: JSON.stringify({
                    error: 'Failed to stringify response',
                  }),
                  mimeType: 'application/json',
                },
              ],
            };
          }

          return {
            contents: [
              {
                uri: domain,
                text: stringifyResult.value,
                mimeType: 'application/json',
              },
            ],
          };
        }
      );
    })
  );
};

const getResourceResponse = async (resource: string, request: Request) => {
  const client = new x402HTTPClient(new x402Client());

  const fetchResult = await safeFetch(surface, request);

  if (fetchResult.isErr()) {
    return err('fetch', surface, {
      cause: 'network',
      message: `Failed to fetch resource: ${resource}`,
    });
  }

  const response = fetchResult.value;

  if (response.status !== 402) {
    return err('fetch', surface, {
      cause: 'not_402',
      message: `Resource did not return 402: ${resource}`,
    });
  }

  const paymentRequiredResult = await safeGetPaymentRequired(
    surface,
    client,
    response
  );

  if (paymentRequiredResult.isErr()) {
    return err('x402', surface, {
      cause: 'parse_payment_required',
      message: `Failed to parse payment required for: ${resource}`,
    });
  }

  return ok({
    paymentRequired: paymentRequiredResult.value,
    resource,
  });
};
