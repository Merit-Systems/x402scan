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
import { ChatError } from '@/lib/errors';

import { SUPPORTED_CHAINS } from '@/types/chain';

import type { SupportedChain } from '@/types/chain';
import type { EnhancedOutputSchema } from '@/lib/x402/schema';
import type { ResourceRequestMetadata } from '@x402scan/scan-db';
import type { Tool } from 'ai';
import { getUserWallets } from '../cdp/server-wallet/user';
import { usdc } from '@/lib/tokens/usdc';

interface CreateX402AIToolsParams {
  resourceIds: string[];
  chatId: string;
  userId: string;
  maxAmount?: number;
}

export async function createX402AITools({
  resourceIds,
  chatId,
  userId,
  maxAmount,
}: CreateX402AIToolsParams): Promise<Record<string, Tool>> {
  const { wallets } = await getUserWallets(userId);

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

            const supportedAccepts = resource.accepts.filter(accept =>
              SUPPORTED_CHAINS.includes(accept.network as SupportedChain)
            );

            if (supportedAccepts.length === 0) {
              throw new ChatError(
                'not_found:tool',
                `This resource does not accept USDC on any networks supported by x402scan`
              );
            }

            const usdcBalances = await Promise.all(
              supportedAccepts.map(async accept => ({
                network: accept.network as SupportedChain,
                balance: await wallets[
                  accept.network as SupportedChain
                ].getTokenBalance({
                  token: usdc(accept.network as SupportedChain),
                }),
              }))
            ).then(balances =>
              balances
                .filter(balance => balance.balance > 0)
                .sort((a, b) => b.balance - a.balance)
            );

            if (usdcBalances.length === 0) {
              throw new ChatError(
                'payment_required:tool',
                `You do not have USDC in your composer wallet for the networks supported by this tool.`
              );
            }

            const fetchWithPayment = wrapFetchWithPayment(
              fetch,
              await wallets[usdcBalances[0]!.network].signer(),
              maxAmount ? BigInt(parseUnits(String(maxAmount), 6)) : undefined
            );

            try {
              const response = await fetchWithPayment(
                new URL(
                  `/api/proxy?url=${encodeURIComponent(url)}&share_data=true`,
                  env.NEXT_PUBLIC_PROXY_URL
                ).toString(),
                requestInit
              ).catch(error => {
                if (error instanceof ChatError) {
                  throw error;
                }
                throw new ChatError('server:tool');
              });
              if (response.status !== 200) {
                throw ChatError.fromStatusCode(response.status, 'tool');
              }
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
              if (error instanceof ChatError) {
                throw error;
              }
              throw new ChatError('server:tool');
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
