import { searchResources } from '../db/resources/resource';
import { enhancedAcceptsSchema, enhancedOutputSchema } from '@/lib/x402/schema';

import type { searchResourcesSchema } from '../db/resources/resource';
import type { z } from 'zod';

interface X402ToolResponse {
  id: string;
  favicon: string | null;
  resource: string;
  description: string;
  invocations: number;
  maxAmountRequired: string;
}

export async function searchX402Tools(
  input: z.infer<typeof searchResourcesSchema>
) {
  const resources = await searchResources(input);

  const toolDefinitions: X402ToolResponse[] = [];
  for (const resource of resources) {
    if (resource.accepts) {
      for (const accept of resource.accepts) {
        const parsedAccept = enhancedAcceptsSchema
          .extend({
            outputSchema: enhancedOutputSchema,
          })
          .safeParse({
            ...accept,
            maxAmountRequired: accept.maxAmountRequired.toString(),
          });
        if (!parsedAccept.success) {
          continue;
        }
        const { description } = parsedAccept.data;
        toolDefinitions.push({
          id: resource.id,
          resource: resource.resource,
          description: description,
          favicon: resource.origin.favicon,
          invocations: resource._count.toolCalls,
          maxAmountRequired: accept.maxAmountRequired.toString(),
        });
      }
    }
  }

  return toolDefinitions;
}
