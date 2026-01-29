import { safeCheckX402Endpoint } from '@/shared/neverthrow/x402';
import { log } from '@/shared/log';

import { getWebPageMetadata } from './site-metadata';
import { getInputSchema } from './x402-extensions';

import { fetchWellKnown } from '../tools/lib/fetch-well-known';

interface ListOriginResourcesProps {
  origin: string;
  surface: string;
}

export const getOriginData = async ({
  origin,
  surface,
}: ListOriginResourcesProps) => {
  const metadata = (await getWebPageMetadata(origin)).match(
    ok => ok,
    () => null
  );
  const hostname = URL.canParse(origin) ? new URL(origin).hostname : origin;

  const wellKnownResult = await fetchWellKnown({
    surface,
    url: origin,
  });

  if (wellKnownResult.isErr()) {
    log.error(
      `Failed to fetch well-known for ${hostname}:`,
      wellKnownResult.error
    );
    return;
  }

  const resources = await Promise.all(
    wellKnownResult.value.resources.map(async resource => {
      const checkX402EndpointResult = await safeCheckX402Endpoint({
        surface,
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
    (resource): resource is NonNullable<typeof resource> => resource !== null
  );

  const resourcesWithSchema = filteredResources
    .map(resource => {
      const inputSchema = getInputSchema(resource.paymentRequired?.extensions);
      if (!inputSchema) {
        return null;
      }
      return {
        resource,
        inputSchema,
      };
    })
    .filter((result): result is NonNullable<typeof result> => result !== null);

  return {
    hostname,
    metadata,
    resources: resourcesWithSchema,
  };
};
