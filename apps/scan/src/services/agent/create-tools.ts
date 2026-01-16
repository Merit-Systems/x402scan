import { tool } from 'ai';

import { listResourcesForTools } from '@/services/db/resources/resource';

import { inputSchemaToZodSchema } from './utils';

import {
  paymentRequirementsSchemaV1,
  outputSchemaV1,
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
        // Fix for v2 resources: transform outputSchema to v1 format
        const acceptBase: Record<string, unknown> = { 
          ...accept, 
          network: accept.network, 
          maxAmountRequired: accept.maxAmountRequired.toString() 
        };
        const acceptToParse = (() => {
          if (resource.x402Version === 2 && accept.outputSchema && typeof accept.outputSchema === 'object' && 'input' in accept.outputSchema) {
            const outputSchema = accept.outputSchema as { input?: Record<string, unknown>; output?: unknown };
            if (outputSchema.input && typeof outputSchema.input === 'object') {
              const input = { ...outputSchema.input };
              let inferredMethod = 'GET';
              
              // Infer method: POST if body exists, GET if queryParams exists
              if (input.body) {
                inferredMethod = 'POST';
              } else if (input.queryParams) {
                inferredMethod = 'GET';
              }
              
              // Transform v2 body format to v1 bodyFields format
              if (input.body && typeof input.body === 'object' && 'properties' in input.body) {
                // Convert body.properties to bodyFields format
                input.bodyFields = (input.body as { properties?: Record<string, unknown> }).properties;
                delete input.body;
              }
              
              // Add method if missing
              if (!('method' in input)) {
                input.method = inferredMethod;
              }
              
              const modifiedOutputSchema = {
                ...outputSchema,
                input,
              };
              return {
                ...acceptBase,
                outputSchema: modifiedOutputSchema,
              };
            }
          }
          return acceptBase;
        })();
        
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
