import { tool } from 'ai';

import { Permi, toViemAccount } from '@permi/ts';

import { listResourcesForTools } from '@/services/db/resources/resource';

import { inputSchemaToZodSchema } from './utils';

import {
  EnhancedPaymentRequirementsSchema,
  enhancedOutputSchema,
} from '@/lib/x402/schema';

import type { EnhancedOutputSchema } from '@/lib/x402/schema';
import type { Account, ResourceRequestMetadata } from '@x402scan/scan-db/types';
import type { Tool } from 'ai';
import { wrapFetchWithPayment } from '@/lib/x402/wrap-fetch';
import type { Signer } from 'x402-fetch';

export async function createX402AITools(
  resourceIds: string[],
  permiAccount: Account
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
          inputSchema: parametersSchema,
          execute: async input => {
            const method =
              parsedAccept.data.outputSchema.input.method.toUpperCase();
            const url = new URL(resource.resource);
            let requestInit: RequestInit = {
              method,
            };
            if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
              for (const [key, value] of Object.entries(input)) {
                if (value !== undefined && value !== null) {
                  if (typeof value === 'object') {
                    url.searchParams.set(key, JSON.stringify(value));
                  } else if (typeof value === 'number') {
                    url.searchParams.set(key, String(value));
                  } else {
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    url.searchParams.set(key, String(value));
                  }
                }
              }
            }
            // For POST/PUT/PATCH/DELETE: send as JSON body
            else {
              requestInit = {
                ...requestInit,
                body: JSON.stringify(input),
                headers: {
                  ...requestInit.headers,
                  'Content-Type': 'application/json',
                },
              };
            }

            const permi = new Permi({
              getAccessToken: () => permiAccount.access_token!,
            });
            const signer = await toViemAccount(permi);
            const fetchWithPayment = wrapFetchWithPayment(
              fetch,
              signer as Signer,
              100000000n
            );
            const response = await fetchWithPayment(
              url.toString(),
              requestInit
            );
            return response.json() as Promise<unknown>;
          },
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
