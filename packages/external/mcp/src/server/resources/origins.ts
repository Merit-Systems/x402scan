import { safeStringifyJson } from '@/shared/neverthrow/json';
import { getState } from '@/shared/state';
import { log } from '@/shared/log';

import { getOriginData } from '../lib/origin-data';

import type { RegisterResources } from '../types';
import type { JsonObject } from '@/shared/neverthrow/json/types';

export const registerOriginResources: RegisterResources = async ({
  server,
}) => {
  const { origins } = getState();
  await Promise.all(
    origins.map(async origin => {
      const surface = `${origin}-resource`;

      const originData = await getOriginData({ origin, surface });

      if (!originData) {
        return;
      }

      const { hostname, metadata, resources } = originData;

      const stringifyResult = safeStringifyJson(surface, {
        server: originData.hostname,
        name: metadata?.title ?? '',
        description: metadata?.description ?? '',
        resources: resources.map(({ resource, inputSchema }) => ({
          url: resource.resource,
          schema: inputSchema as JsonObject,
          mimeType: resource.paymentRequired.resource.mimeType,
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
        hostname,
        `api://${hostname}`,
        {
          title: metadata?.title ?? origin,
          description: metadata?.description ?? '',
          mimeType: 'application/json',
        },
        () => ({
          contents: [
            {
              uri: hostname,
              text: stringifyResult.value,
              mimeType: 'application/json',
            },
          ],
        })
      );
    })
  );
};
