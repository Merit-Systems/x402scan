import { safeStringifyJson } from '@/shared/neverthrow/json';
import { safeCheckX402Endpoint } from '@/shared/neverthrow/x402';
import { getState } from '@/shared/state';
import { log } from '@/shared/log';

import { getWebPageMetadata } from './lib';

import { getInputSchema } from '../lib/x402-extensions';

import { fetchWellKnown } from '../tools/lib/fetch-well-known';

import type { RegisterResources } from '../types';
import type { JsonObject } from '@/shared/neverthrow/json/types';

const surface = 'registerOriginResources';

export const registerOriginResources: RegisterResources = async ({
  server,
}) => {
  const { origins } = getState();
  await Promise.all(
    origins.map(async origin => {
      const metadata = (await getWebPageMetadata(origin)).match(
        ok => ok,
        () => null
      );
      const strippedOrigin = origin
        .replace('https://', '')
        .replace('http://', '');

      const wellKnownResult = await fetchWellKnown({
        surface: `${origin}-resource`,
        url: origin,
      });

      if (wellKnownResult.isErr()) {
        log.error(
          `Failed to fetch well-known for ${origin}:`,
          wellKnownResult.error
        );
        return;
      }

      const resources = await Promise.all(
        wellKnownResult.value.resources.map(async resource => {
          const checkX402EndpointResult = await safeCheckX402Endpoint({
            surface: `${origin}-resource`,
            resource,
          });

          return checkX402EndpointResult.match(
            ok => ok,
            err => {
              log.error(`Failed to check x402 endpoint for ${resource}:`, err);
              return null;
            }
          );
        })
      );

      const filteredResources = resources.filter(
        (resource): resource is NonNullable<typeof resource> =>
          resource !== null
      );

      const stringifyResult = safeStringifyJson(surface, {
        server: strippedOrigin,
        name: metadata?.title ?? '',
        description: metadata?.description ?? '',
        resources: filteredResources.map(({ resource, paymentRequired }) => ({
          url: resource,
          schema: getInputSchema(paymentRequired.extensions) as JsonObject,
          mimeType: paymentRequired.resource.mimeType,
        })),
      });

      if (stringifyResult.isErr()) {
        log.error(
          `Failed to stringify response for ${origin}:`,
          stringifyResult.error
        );
        return;
      }

      server.registerResource(
        strippedOrigin,
        `api://${strippedOrigin}`,
        {
          title: metadata?.title ?? origin,
          description: metadata?.description ?? '',
          mimeType: 'application/json',
        },
        () => ({
          contents: [
            {
              uri: strippedOrigin,
              text: stringifyResult.value,
              mimeType: 'application/json',
            },
          ],
        })
      );
    })
  );
};
