import { z } from 'zod';

import { mixedAddressSchema } from '@/lib/schemas';
import { ChainIdToNetwork } from '@/lib/x402/chain-mapping';

import type { AcceptsNetwork } from '@x402scan/scan-db';
import type { OutputSchema } from '@/lib/x402';

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
