import { safeStringifyJson } from '@/shared/neverthrow/json';
import { getState } from '@/shared/state';

import { getWebPageMetadata } from './_lib';

import { getInputSchema } from '../lib/x402-extensions';

import { fetchWellKnown } from '../tools/lib/fetch-well-known';
import { log } from '@/shared/log';
import { checkX402Endpoint } from '../tools/lib/check-x402-endpoint';

import type { RegisterResources } from './types';
import type { JsonObject } from '@/shared/neverthrow/json/types';

const surface = 'registerOrigins';

export const registerOrigins: RegisterResources = async ({ server }) => {
  const { origins } = getState();
  await Promise.all(
    origins.map(async origin => {
      const metadataResult = await getWebPageMetadata(origin);
      const strippedOrigin = origin
        .replace('https://', '')
        .replace('http://', '');
      const metadata = metadataResult.isOk() ? metadataResult.value : null;
      server.registerResource(
        strippedOrigin,
        `api://${strippedOrigin}`,
        {
          title: metadata?.title ?? origin,
          description: metadata?.description ?? '',
          mimeType: 'application/json',
        },
        async uri => {
          const wellKnownUrl = `${uri.toString().replace('api://', 'https://')}/.well-known/x402`;
          const wellKnownResult = await fetchWellKnown({
            surface: `${origin}-resource`,
            url: wellKnownUrl,
          });

          if (wellKnownResult.isErr()) {
            log.error(
              `Failed to fetch well-known for ${origin}:`,
              wellKnownResult.error
            );
            return {
              contents: [
                {
                  uri: strippedOrigin,
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
              const checkX402EndpointResult = await checkX402Endpoint({
                surface: `${origin}-resource`,
                resource,
              });

              if (checkX402EndpointResult.isErr()) {
                log.error(
                  `Failed to check x402 endpoint for ${resource}:`,
                  checkX402EndpointResult.error
                );
                return null;
              }

              return checkX402EndpointResult.value;
            })
          );

          const payload = {
            server: strippedOrigin,
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
            log.error(
              `Failed to stringify response for ${origin}:`,
              stringifyResult.error
            );
            return {
              contents: [
                {
                  uri: strippedOrigin,
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
                uri: strippedOrigin,
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
