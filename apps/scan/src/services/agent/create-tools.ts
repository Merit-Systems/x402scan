import { parseUnits } from 'viem';

import z from 'zod';
import { tool } from 'ai';

import { createToolCall } from '@/services/db/composer/tool-call';
import { listResourcesForTools } from '@/services/db/resources/resource';

import { inputSchemaToZodSchema } from './utils';

import { env } from '@/env';

import {
  EnhancedPaymentRequirementsSchema,
  enhancedOutputSchema,
} from '@/lib/x402/schema';
import { wrapFetchWithPayment } from '@/lib/x402/wrap-fetch';
import { ChatSDKError } from '@/lib/errors';

import type { EnhancedOutputSchema } from '@/lib/x402/schema';
import type { ResourceRequestMetadata } from '../../../../../databases/scan/src';
import type { Signer } from 'x402/types';
import type { Tool } from 'ai';

interface CreateX402AIToolsParams {
  resourceIds: string[];
  walletClient: Signer;
  chatId: string;
  maxAmount?: number;
}

export async function createX402AITools({
  resourceIds,
  walletClient,
  chatId,
  maxAmount,
}: CreateX402AIToolsParams): Promise<Record<string, Tool>> {
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
        const method =
          parsedAccept.data.outputSchema.input.method.toUpperCase();

        const hasParameters = Object.keys(parametersSchema.shape).length > 0;

        aiTools[resource.id] = tool({
          description: `${toolName}: ${parsedAccept.data.description} (Paid API - ${parsedAccept.data.maxAmountRequired} on ${parsedAccept.data.network})`,
          inputSchema:
            Object.keys(parametersSchema.shape).length > 0
              ? parametersSchema
              : z.object({ continue: z.boolean() }),
          execute: async (params: z.infer<typeof parametersSchema>) => {
            if (
              maxAmount &&
              BigInt(parsedAccept.data.maxAmountRequired) >
                BigInt(parseUnits(String(maxAmount), 6))
            ) {
              throw new ChatSDKError(
                'payment_required:chat',
                `The maximum amount per tool call on free tier is ${maxAmount}. You can fund your agent to increase the maximum amount per tool call.`
              );
            }

            let url = resource.resource;
            const requestInit: RequestInit = { method };

            if (hasParameters) {
              // For GET/HEAD/OPTIONS: append query params to URL
              if (
                method === 'GET' ||
                method === 'HEAD' ||
                method === 'OPTIONS'
              ) {
                const queryParams = new URLSearchParams();
                for (const [key, value] of Object.entries(params)) {
                  if (value !== undefined && value !== null) {
                    if (typeof value === 'object') {
                      queryParams.append(key, JSON.stringify(value));
                    } else if (typeof value === 'number') {
                      queryParams.append(key, String(value));
                    } else {
                      // eslint-disable-next-line @typescript-eslint/no-base-to-string
                      queryParams.append(key, String(value));
                    }
                  }
                }
                url = `${resource.resource}?${queryParams.toString()}`;
              }
              // For POST/PUT/PATCH/DELETE: send as JSON body
              else {
                requestInit.body = JSON.stringify(params);
                requestInit.headers = { 'Content-Type': 'application/json' };
              }

              if (
                resource.requestMetadata &&
                typeof resource.requestMetadata.headers === 'object' &&
                resource.requestMetadata.headers !== null &&
                !Array.isArray(resource.requestMetadata.headers) &&
                resource.requestMetadata.headers !== undefined &&
                Object.keys(resource.requestMetadata.headers).length > 0
              ) {
                requestInit.headers = {
                  ...(requestInit.headers ?? {}),
                  ...resource.requestMetadata.headers,
                } as HeadersInit;
              }
            }

            try {
              const fetchWithPayment = wrapFetchWithPayment(
                fetch,
                walletClient,
                maxAmount
                  ? BigInt(parseUnits(String(maxAmount), 6))
                  : resource.accepts[0]!.maxAmountRequired
              );
              const response = await fetchWithPayment(
                new URL(
                  `/api/proxy?url=${encodeURIComponent(url)}&share_data=true`,
                  env.NEXT_PUBLIC_PROXY_URL
                ).toString(),
                requestInit
              );
              void createToolCall({
                resource: {
                  connect: { id: resource.id },
                },
                chat: {
                  connect: { id: chatId },
                },
              });
              const data: unknown = await response.json();
              return data;
            } catch (error) {
              console.error('Error calling tool', error);
              throw error;
            }
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
