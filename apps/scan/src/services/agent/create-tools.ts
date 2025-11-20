import z from 'zod';
import { tool } from 'ai';

import { listResourcesForTools } from '@/services/db/resources/resource';

import { inputSchemaToZodSchema } from './utils';

import {
  EnhancedPaymentRequirementsSchema,
  enhancedOutputSchema,
} from '@/lib/x402/schema';

import type { EnhancedOutputSchema } from '@/lib/x402/schema';
import type { ResourceRequestMetadata } from '@x402scan/scan-db';
import type { Tool } from 'ai';

export async function createX402AITools(
  resourceIds: string[]
): Promise<Record<string, Tool>> {
  const resources = await listResourcesForTools(resourceIds);

  const aiTools: Record<string, Tool> = {};

  for (const resource of resources) {
    if (resource.accepts) {
      for (const accept of resource.accepts) {
        const parsedAccept = EnhancedPaymentRequirementsSchema.extend({
          outputSchema: enhancedOutputSchema,
        }).safeParse({
          ...accept,
          maxAmountRequired: accept.maxAmountRequired.toString(),
        });
        if (!parsedAccept.success) {
          continue;
        }
        const urlParts = new URL(resource.resource);
        const toolName = urlParts.pathname
          .split('/')
          .filter(Boolean)
          .join('_')
          .replace(/[^a-zA-Z0-9_]/g, '_');

        const parametersSchema = inputSchemaToZodSchema(
          mergeInputSchemaAndRequestMetadata(
            parsedAccept.data.outputSchema.input,
            resource.requestMetadata ?? undefined
          )
        );

        aiTools[resource.id] = tool({
          description: `${toolName}: ${parsedAccept.data.description} (Paid API - ${parsedAccept.data.maxAmountRequired} on ${parsedAccept.data.network})`,
          inputSchema:
            Object.keys(parametersSchema.shape).length > 0
              ? parametersSchema
              : z.object({ continue: z.boolean() }),
        });
      }
    }
  }

  return aiTools;
}

const mergeInputSchemaAndRequestMetadata = (
  inputSchema: EnhancedOutputSchema['input'],
  requestMetadata?: ResourceRequestMetadata
) => {
  return {
    ...inputSchema,
    ...(typeof requestMetadata?.inputSchema === 'object'
      ? requestMetadata?.inputSchema
      : {}),
  };
};
