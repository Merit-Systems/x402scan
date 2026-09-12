import {
  PaymentRequiredV1Schema,
  PaymentRequirementsV1Schema,
} from '@x402/core/schemas';
import { z as z3 } from 'zod3';

import { ChainIdToNetwork } from '../chain-mapping';
import { FieldDefSchema } from '../shared';

// Inlined from the v1 `x402` SDK. v2 dropped the typed HTTP request structure
// in favor of an opaque `inputSchema: Record<string, unknown>`, so there's no
// equivalent in `@x402/*` to import.
const HTTPRequestStructureSchema = z3.object({
  type: z3.literal('http'),
  method: z3.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']),
  queryParams: z3.record(z3.string(), z3.string()).optional(),
  bodyType: z3
    .enum(['json', 'form-data', 'multipart-form-data', 'text', 'binary'])
    .optional(),
  bodyFields: z3.record(z3.string(), z3.any()).optional(),
  headerFields: z3.record(z3.string(), z3.any()).optional(),
});

export const outputSchemaV1 = z3.object({
  input: HTTPRequestStructureSchema.omit({
    queryParams: true,
    bodyFields: true,
    headerFields: true,
  }).extend({
    headerFields: z3.record(FieldDefSchema).optional(),
    queryParams: z3.record(FieldDefSchema).optional(),
    bodyFields: z3.record(FieldDefSchema).optional(),
  }),
  output: z3.record(z3.string(), z3.any()).optional().nullable(),
});

const namedNetwork = z3.enum([
  'base-sepolia',
  'avalanche-fuji',
  'base',
  'sei',
  'sei-testnet',
  'avalanche',
  'iotex',
  'solana-devnet',
  'solana',
]);

const networkSchemaV1 = z3.union([
  namedNetwork,
  // Any well-formed CAIP-2 EVM identifier is accepted, even for chain ids
  // that don't have a human-friendly entry in `ChainIdToNetwork` yet. This
  // mirrors `normalizeChainId` in `../index.ts`, which already falls back to
  // the raw `eip155:<id>` string (`ChainIdToNetwork[id] ?? chainId`) instead
  // of rejecting the response outright. Without this fallback, a single
  // unrecognized-but-valid chain id in `accepts[]` fails the whole v1 array
  // parse via Zod, which surfaces to integrators as an opaque "No valid x402
  // response found" even though the 402 challenge itself is fully spec
  // compliant (see Merit-Systems/x402scan#782 for the same failure mode on a
  // different chain).
  z3
    .string()
    .refine(v => v.startsWith('eip155:') && !Number.isNaN(Number(v.split(':')[1])), {
      message: 'Invalid network',
    })
    .transform(v => ChainIdToNetwork[Number(v.split(':')[1])] ?? v),
]);

export const paymentRequirementsSchemaV1 = PaymentRequirementsV1Schema.extend({
  network: networkSchemaV1,
  outputSchema: outputSchemaV1.optional(),
});

export const x402ResponseSchemaV1 = PaymentRequiredV1Schema.omit({
  error: true,
  accepts: true,
}).extend({
  x402Version: z3.literal(1).default(1),
  error: z3.string().nullish(),
  accepts: z3.array(paymentRequirementsSchemaV1).optional(),
});

export type X402ResponseV1 = z3.infer<typeof x402ResponseSchemaV1>;
export type OutputSchemaV1 = z3.infer<typeof outputSchemaV1>;
