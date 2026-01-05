import z3 from 'zod3';

import { searchResources } from '../db/resources/resource';
import {
  EnhancedPaymentRequirementsSchema,
  enhancedOutputSchema,
} from '@/lib/x402/schema';

import { SUPPORTED_CHAINS } from '@/types/chain';

import type { searchResourcesSchema } from '../db/resources/resource';
import type { z } from 'zod';
import type { SupportedChain } from '@/types/chain';
import { convertTokenAmount } from '@/lib/token';
import { usdc } from '@/lib/tokens/usdc';

type X402ToolResponse = {
  id: string;
  favicon: string | null;
  resource: string;
  description: string;
  invocations: number;
  accepts: {
    maxAmountRequired: number;
    chain: SupportedChain;
  }[];
};

export async function searchX402Tools(
  input: z.infer<typeof searchResourcesSchema>
) {
  const resources = await searchResources(input);

  const toolDefinitions: X402ToolResponse[] = [];
  for (const resource of resources) {
    if (resource.accepts) {
      const parsedAccepts = z3
        .array(
          EnhancedPaymentRequirementsSchema.extend({
            outputSchema: enhancedOutputSchema,
          })
        )
        .safeParse(
          resource.accepts.map(accept => ({
            ...accept,
            maxAmountRequired: accept.maxAmountRequired.toString(),
          }))
        );
      if (!parsedAccepts.success) {
        continue;
      }
      const description =
        parsedAccepts.data.find(accept => accept.description)?.description ??
        '';
      toolDefinitions.push({
        id: resource.id,
        resource: resource.resource,
        description: description,
        favicon: resource.origin.favicon,
        invocations: resource._count.toolCalls,
        accepts: parsedAccepts.data
          .filter(accept =>
            SUPPORTED_CHAINS.includes(accept.network as SupportedChain)
          )
          .map(accept => ({
            maxAmountRequired: convertTokenAmount(
              BigInt(accept.maxAmountRequired),
              usdc(accept.network as SupportedChain).decimals
            ),
            chain: accept.network as SupportedChain,
          })),
      });
    }
  }

  return toolDefinitions;
}
