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
        // #region agent log
        const parseErrors = parsedAccept.success ? null : parsedAccept.error.issues.map(i => ({path:i.path.join('.'),message:i.message}));
        const parsedOutputSchemaInputKeys = parsedAccept.success && parsedAccept.data.outputSchema?.input ? Object.keys(parsedAccept.data.outputSchema.input) : null;
        fetch('http://127.0.0.1:7242/ingest/b580f9ca-6e18-4c38-9de1-256e6503a55a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create-tools.ts:42',message:'Parse result',data:{success:parsedAccept.success,errors:parseErrors,hasOutputSchema:parsedAccept.success?!!parsedAccept.data.outputSchema:null,parsedOutputSchemaInputKeys},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        if (!parsedAccept.success) {
          continue;
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b580f9ca-6e18-4c38-9de1-256e6503a55a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create-tools.ts:45',message:'Before accessing outputSchema.input',data:{hasOutputSchema:!!parsedAccept.data.outputSchema,hasInput:!!parsedAccept.data.outputSchema?.input},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
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

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b580f9ca-6e18-4c38-9de1-256e6503a55a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create-tools.ts:60',message:'Tool created successfully',data:{resourceId:resource.id,toolName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        aiTools[resource.id] = tool({
          description: `${toolName}: ${parsedAccept.data.description} (Paid API - ${parsedAccept.data.maxAmountRequired} on ${parsedAccept.data.network})`,
          inputSchema: parametersSchema,
        });
      }
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b580f9ca-6e18-4c38-9de1-256e6503a55a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create-tools.ts:68',message:'createX402AITools exit',data:{toolsCreated:Object.keys(aiTools).length,toolIds:Object.keys(aiTools)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
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
