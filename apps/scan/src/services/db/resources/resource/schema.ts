import { z } from "zod";

import { mixedAddressSchema } from "@/lib/schemas";
import { ChainIdToNetwork } from "@/lib/x402/chain-mapping";
import { normalizeChainId } from "@/lib/x402";
import { AcceptsNetwork } from "@x402scan/scan-db/types";

import type { OutputSchema } from "@/lib/x402";

const acceptsNetworkSchema = z.enum(AcceptsNetwork);

export function normalizeKnownAcceptNetworks<T extends { network: string }>(
  accepts: readonly T[]
): (T & { network: AcceptsNetwork })[] {
  return accepts.flatMap((accept) => {
    const network = acceptsNetworkSchema.safeParse(
      normalizeChainId(accept.network)
    );
    return network.success ? [{ ...accept, network: network.data }] : [];
  });
}

export const upsertResourceSchema = z.object({
  resource: z.string(),
  method: z.string().default(""),
  type: z.enum(["http"]),
  x402Version: z.number(),
  lastUpdated: z.coerce.date(),
  metadata: z.record(z.string(), z.any()).optional(),
  accepts: z.array(
    z.object({
      scheme: z.string().min(1),
      network: z.union([
        acceptsNetworkSchema,
        z
          .string()
          .refine((v) => v.startsWith("eip155:"))
          .transform((v) =>
            ChainIdToNetwork[Number(v.split(":")[1])]?.replace("-", "_")
          )
          .pipe(acceptsNetworkSchema),
        z
          .string()
          .refine((v) => v.startsWith("solana:"))
          .transform((v) => normalizeChainId(v))
          .pipe(acceptsNetworkSchema),
      ]),
      payTo: mixedAddressSchema,
      description: z.string().optional().default(""),
      maxAmountRequired: z.string(),
      mimeType: z.string().optional().default(""),
      maxTimeoutSeconds: z.number(),
      asset: z.string(),
      outputSchema: z.custom<OutputSchema>().optional(),
      extra: z.record(z.string(), z.any()).optional(),
    })
  ),
});
