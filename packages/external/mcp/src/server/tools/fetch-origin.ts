import { getState } from '@/shared/state';
import type { RegisterTools } from '../types';
import z from 'zod';
import { fetchWellKnown } from './lib/fetch-well-known';
import { checkX402Endpoint } from './lib/check-x402-endpoint';
import { mcpSuccessJson } from './response';
import { getInputSchema } from '../lib/x402-extensions';

export const registerFetchOriginTool: RegisterTools = async ({ server }) => {
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
          if (inputSchema === undefined) {
            return null;
          }
          return {
            resource,
            inputSchema,
          };
        })
        .filter(
          (result): result is NonNullable<typeof result> => result !== null
        );
      const strippedOrigin = origin
        .replace('https://', '')
        .replace('http://', '');
      validResults.forEach(({ resource, inputSchema }, index) => {
        if (!inputSchema.properties.body) {
          return;
        }
        server.registerTool(
          `${strippedOrigin}-resource-${index}`,
          {
            title: resource.resource,
            description: resource.paymentRequired.resource.description,
            inputSchema: z.fromJSONSchema(inputSchema.properties.body),
          },
          async input => {
            return mcpSuccessJson(input);
          }
        );
      });
    })
  );
};
