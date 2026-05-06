import { z } from 'zod';

import { mixedAddressSchema } from '@/lib/schemas';
import { ChainIdToNetwork } from '@/lib/x402/chain-mapping';

import type { AcceptsNetwork } from '@x402scan/scan-db';
import type { OutputSchema } from '@/lib/x402';

// CAIP-2 genesis-hash identifiers for Solana clusters. agentcash.dev (and any
// other x402 server using the canonical CAIP-2 form) advertises Solana mainnet
// as `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` rather than the bare `solana`
// literal, so the schema needs a branch that recognizes both spellings.
const SOLANA_CAIP2_TO_NETWORK: Record<string, AcceptsNetwork> = {
  mainnet: 'solana',
  '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'solana',
  devnet: 'solana_devnet',
  EtWTRABZaYq6iMfeYKouRu166VU2xqa1: 'solana_devnet',
};

export const upsertResourceSchema = z.object({
  resource: z.string(),
  type: z.enum(['http']),
  x402Version: z.number(),
  lastUpdated: z.coerce.date(),
  metadata: z.record(z.string(), z.any()).optional(),
  accepts: z.array(
    z.object({
      scheme: z.string().min(1),
      network: z.union([
        z.enum([
          'base_sepolia',
          'avalanche_fuji',
          'base',
          'sei',
          'sei_testnet',
          'avalanche',
          'iotex',
          'solana_devnet',
          'solana',
        ]),
        z
          .string()
          .refine(v => {
            return (
              v.startsWith('eip155:') &&
              !!ChainIdToNetwork[Number(v.split(':')[1])]
            );
          })
          .transform(
            v =>
              ChainIdToNetwork[Number(v.split(':')[1])]!.replace(
                '-',
                '_'
              ) as AcceptsNetwork
          ),
        z
          .string()
          .refine(v => {
            if (!v.startsWith('solana:')) return false;
            const suffix = v.slice('solana:'.length);
            return suffix in SOLANA_CAIP2_TO_NETWORK;
          })
          .transform(
            v => SOLANA_CAIP2_TO_NETWORK[v.slice('solana:'.length)]!
          ),
      ]),
      payTo: mixedAddressSchema,
      description: z.string().optional().default(''),
      maxAmountRequired: z.string(),
      mimeType: z.string().optional().default(''),
      maxTimeoutSeconds: z.number(),
      asset: z.string(),
      outputSchema: z.custom<OutputSchema>().optional(),
      extra: z.record(z.string(), z.any()).optional(),
    })
  ),
});
