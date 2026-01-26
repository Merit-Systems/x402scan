import { x402HTTPClient } from '@x402/core/client';
import { x402Client } from '@x402/core/client';

import { getWebPageMetadata } from './_lib';

import { getInputSchema } from '../lib/x402-extensions';

import type { RegisterResources } from './types';

const origins = ['enrichx402.com'];

export const registerOrigins: RegisterResources = async ({ server }) => {
  await Promise.all(
    origins.map(async origin => {
      const metadataResult = await getWebPageMetadata(`https://${origin}`);
      const metadata = metadataResult.isOk() ? metadataResult.value : null;
      server.registerResource(
        origin,
        `api://${origin}`,
        {
          title: metadata?.title ?? origin,
          description: metadata?.description ?? '',
          mimeType: 'application/json',
        },
        async uri => {
          const response = (await fetch(
            `${uri.toString().replace('api://', 'https://')}/.well-known/x402`
          ).then(response => response.json())) as { resources: string[] };
          const resources = await Promise.all(
            response.resources.map(async resource => {
              const resourceResponse = await getResourceResponse(
                resource,
                await fetch(resource, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                })
              );
              if (resourceResponse) {
                return resourceResponse;
              }
              const getResponse = await getResourceResponse(
                resource,
                await fetch(resource, {
                  method: 'GET',
                })
              );
              if (getResponse) {
                return getResponse;
              }
              console.error(`Failed to get resource response for ${resource}`);
              return null;
            })
          );
          return {
            contents: [
              {
                uri: origin,
                text: JSON.stringify({
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
                }),
                mimeType: 'application/json',
              },
            ],
          };
        }
      );
    })
  );
};

const getResourceResponse = async (resource: string, response: Response) => {
  const client = new x402HTTPClient(new x402Client());
  if (response.status === 402) {
    const paymentRequired = client.getPaymentRequiredResponse(
      name => response.headers.get(name),
      JSON.parse(await response.text())
    );
    return {
      paymentRequired,
      resource,
    };
  }
  return null;
};
