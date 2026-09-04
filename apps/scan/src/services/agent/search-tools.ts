import z3 from "zod3";

import { searchResources } from "../db/resources/resource";
import {
  coerceAcceptForV1Schema,
  outputSchemaV1,
  paymentRequirementsSchemaV1,
} from "@/lib/x402";

import { supportedChainSchema } from "@/lib/schemas";

import type { searchResourcesSchema } from "../db/resources/resource";
import type { z } from "zod";
import type { SupportedChain } from "@/types/chain";
import { convertTokenAmount } from "@/lib/token";
import { usdc } from "@/lib/tokens/usdc";

interface X402ToolResponse {
  id: string;
  favicon: string | null;
  resource: string;
  description: string;
  invocations: number;
  accepts: {
    maxAmountRequired: number;
    chain: SupportedChain;
  }[];
}

export async function searchX402Tools(
  input: z.infer<typeof searchResourcesSchema>
) {
  const resources = await searchResources(input);

  const toolDefinitions: X402ToolResponse[] = [];
  for (const resource of resources) {
    const parsedAccepts = z3
      .array(
        paymentRequirementsSchemaV1.extend({
          outputSchema: outputSchemaV1,
        })
      )
      .safeParse(
        resource.accepts.map((accept) =>
          coerceAcceptForV1Schema({
            x402Version: resource.x402Version,
            accept,
          })
        )
      );
    if (!parsedAccepts.success) {
      continue;
    }
    const description =
      parsedAccepts.data.find((accept) => accept.description)?.description ??
      "";
    toolDefinitions.push({
      id: resource.id,
      resource: resource.resource,
      description: description,
      favicon: resource.origin.favicon,
      invocations: resource._count.toolCalls,
      accepts: parsedAccepts.data.flatMap((accept) => {
        const chain = supportedChainSchema.safeParse(accept.network);
        return chain.success
          ? [
              {
                maxAmountRequired: convertTokenAmount(
                  BigInt(accept.maxAmountRequired),
                  usdc(chain.data).decimals
                ),
                chain: chain.data,
              },
            ]
          : [];
      }),
    });
  }

  return toolDefinitions;
}
