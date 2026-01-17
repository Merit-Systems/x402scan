import { tool } from 'ai';

import { listResourcesForTools } from '@/services/db/resources/resource';

import { inputSchemaToZodSchema } from './utils';

import {
  paymentRequirementsSchemaV1,
  outputSchemaV1,
  coerceAcceptForV1Schema,
  type OutputSchemaV1,
} from '@/lib/x402';

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
        const acceptToParse = coerceAcceptForV1Schema({
          x402Version: resource.x402Version,
          accept,
        });

        const parsedAccept = paymentRequirementsSchemaV1
          .extend({
            outputSchema: outputSchemaV1,
          })
          .safeParse(acceptToParse);
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
          inputSchema: parametersSchema,
        });
      }
    }
  }

  return aiTools;
}

const mergeInputSchemaAndRequestMetadata = (
  inputSchema: OutputSchemaV1['input'],
  requestMetadata?: ResourceRequestMetadata
) => {
  return {
    ...inputSchema,
    ...(typeof requestMetadata?.inputSchema === 'object'
      ? requestMetadata?.inputSchema
      : {}),
  };
};
