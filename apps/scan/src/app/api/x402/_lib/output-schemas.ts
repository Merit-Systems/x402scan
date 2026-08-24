import z from 'zod';

/**
 * Zod schemas describing the JSON bodies returned by `/api/x402` handlers.
 * Registered on each route with `.output()` so `@agentcash/router` emits a
 * typed `200` response in `/openapi.json`. They document the wire shape
 * (after BigInt/Date serialization) and are intentionally permissive about
 * additional fields: the contract is additive-only (see /docs#versioning).
 */

// ── Primitives ───────────────────────────────────────

const address = z
  .string()
  .describe('Wallet address (0x-prefixed EVM or base58 Solana)');

const chain = z.enum(['base', 'solana']).describe('Chain');

const isoDate = z.string().describe('ISO-8601 timestamp');

const usdc = z.number().describe('USDC amount in whole units');

const paginationMeta = z
  .object({
    page: z.number().int().describe('Page index (0-based)'),
    page_size: z.number().int().describe('Items per page'),
    has_next_page: z.boolean().describe('Whether another page exists'),
  })
  .describe('Pagination metadata');

const paginated = <T extends z.ZodType>(item: T) =>
  z.object({ data: z.array(item), pagination: paginationMeta });

// ── Transfers ────────────────────────────────────────

const transferSchema = z
  .object({
    id: z.string(),
    tx_hash: z.string().describe('On-chain transaction hash / signature'),
    chain,
    block_timestamp: isoDate,
    sender: address.describe('Buyer (payer) address'),
    recipient: address.describe('Merchant (payee) address'),
    transaction_from: address.describe('Address that submitted the tx'),
    token_address: address.describe('USDC token / mint address'),
    address: address.describe('USDC token / mint address (alias)'),
    amount: usdc,
    decimals: z.number().int(),
    facilitator_id: z.string().describe('x402scan facilitator ID'),
    provider: z.string().describe('Index provider'),
    log_index: z.number().int().nullable(),
  })
  .describe('A single x402 USDC transfer');

export const transfersResponseSchema = paginated(transferSchema);

// ── Buyers / merchants ───────────────────────────────

const buyerSchema = z
  .object({
    sender: address,
    facilitator_ids: z.array(z.string()),
    tx_count: z.number().int(),
    total_amount: usdc,
    latest_block_timestamp: isoDate.nullable(),
    unique_sellers: z.number().int(),
    chains: z.array(chain),
  })
  .describe('Aggregate activity for one buyer wallet');

export const buyersResponseSchema = paginated(buyerSchema);

const merchantSchema = z
  .object({
    recipient: address,
    facilitator_ids: z.array(z.string()),
    tx_count: z.number().int(),
    total_amount: usdc,
    latest_block_timestamp: isoDate.nullable(),
    unique_buyers: z.number().int(),
    chains: z.array(chain),
  })
  .describe('Aggregate activity for one merchant wallet');

export const merchantsResponseSchema = paginated(merchantSchema);

// ── Stats ────────────────────────────────────────────

const overallStatsSchema = z
  .object({
    total_transactions: z.number().int(),
    total_amount: usdc,
    unique_buyers: z.number().int(),
    unique_sellers: z.number().int(),
    latest_block_timestamp: isoDate.nullable(),
  })
  .describe('Aggregate payment statistics');

export const overallStatsResponseSchema = z.object({
  data: overallStatsSchema,
});

const walletStatsSchema = z
  .object({
    total_transactions: z.number().int(),
    total_amount: usdc,
    unique_recipients: z.number().int(),
    chains: z.array(chain),
  })
  .describe('Aggregate spend statistics for a wallet');

export const walletStatsResponseSchema = z.object({ data: walletStatsSchema });

// ── Facilitators ─────────────────────────────────────

const facilitatorSchema = z
  .object({
    facilitator_id: z.string(),
    tx_count: z.number().int(),
    total_amount: usdc,
    latest_block_timestamp: isoDate,
    unique_buyers: z.number().int(),
    unique_sellers: z.number().int(),
    chains: z.array(chain),
    facilitator: z
      .object({
        id: z.string(),
        name: z.string(),
        image: z.string().describe('Logo path relative to the site root'),
        docsUrl: z.string(),
        color: z.string(),
        addresses: z
          .record(z.string(), z.array(z.string()))
          .describe('Facilitator addresses keyed by chain'),
      })
      .passthrough()
      .describe('Facilitator metadata'),
    facilitator_addresses: z.array(z.string()),
  })
  .describe('Activity stats for one facilitator');

export const facilitatorsResponseSchema = paginated(facilitatorSchema);

// ── Resources ────────────────────────────────────────

const acceptsSchema = z
  .object({
    id: z.string(),
    resourceId: z.string(),
    scheme: z.string().describe('x402 payment scheme, e.g. "exact"'),
    description: z.string(),
    network: z.string().describe('Network identifier, e.g. "base"'),
    maxAmountRequired: z
      .number()
      .describe('Price per call in USDC (whole units)'),
    resource: z.string().describe('Resource URL'),
    mimeType: z.string(),
    payTo: z.string().describe('Merchant address that receives payment'),
    maxTimeoutSeconds: z.number().int(),
    asset: z.string().describe('Token contract / mint address'),
    outputSchema: z.unknown().nullable().optional(),
    extra: z.unknown().nullable().optional(),
    verified: z.boolean(),
    verifiedAddress: z.string().nullable().optional(),
    verifiedAt: isoDate.nullable().optional(),
  })
  .passthrough()
  .describe('An x402 payment requirement (402 "accepts" entry)');

const originSchema = z
  .object({
    id: z.string().describe('x402scan origin ID'),
    origin: z.string().describe('Origin URL, e.g. https://api.example.com'),
    title: z.string().nullable(),
    description: z.string().nullable(),
    favicon: z.string().nullable(),
    email: z.string().nullable().optional(),
    createdAt: isoDate,
    updatedAt: isoDate,
  })
  .passthrough()
  .describe('The server that hosts a resource');

const resourceSchema = z
  .object({
    id: z.string().describe('x402scan resource ID'),
    resource: z.string().describe('Resource URL'),
    method: z.string().describe('HTTP method'),
    type: z.string().describe('Resource type, e.g. "http"'),
    x402Version: z.number().int(),
    lastUpdated: isoDate,
    metadata: z.unknown().nullable().optional(),
    deprecatedAt: isoDate.nullable().optional(),
    originId: z.string(),
    origin: originSchema,
    accepts: z.array(acceptsSchema),
    tags: z
      .array(
        z
          .object({
            tag: z
              .object({ id: z.string(), name: z.string(), color: z.string() })
              .passthrough(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough()
  .describe('An indexed x402-protected API resource');

export const resourcesResponseSchema = paginated(resourceSchema);

// ── Registry writes ──────────────────────────────────

const registrationDetailSchema = z
  .object({
    url: z.string(),
    method: z.string().optional(),
    error: z.string().optional(),
    reason: z.string().optional(),
  })
  .passthrough();

export const registerOriginResponseSchema = z
  .object({
    success: z.literal(true),
    registered: z.number().int().describe('Resources registered'),
    siwx: z.number().int().describe('Resources requiring SIWX'),
    public: z.number().int().describe('Unprotected resources found'),
    apiKey: z.number().int().describe('API-key-gated resources found'),
    failed: z.number().int(),
    skipped: z.number().int(),
    deprecated: z.number().int(),
    total: z.number().int(),
    source: z.string().describe('Discovery source: openapi or well-known'),
    failedDetails: z.array(registrationDetailSchema).optional(),
    siwxDetails: z.array(registrationDetailSchema).optional(),
    publicDetails: z.array(registrationDetailSchema).optional(),
    apiKeyDetails: z.array(registrationDetailSchema).optional(),
    contactEmail: z.string().optional(),
    warning: z.string().optional(),
  })
  .passthrough();

export const registerResponseSchema = z
  .object({
    success: z.literal(true),
    resource: resourceSchema
      .optional()
      .describe('The registered resource as stored'),
    methodUsed: z.string().optional().describe('HTTP method that returned 402'),
    discovery: z.unknown().optional().describe('Parsed discovery metadata'),
    warnings: z.array(z.string()).optional(),
    contactEmail: z.string().optional(),
    warning: z.string().optional(),
  })
  .passthrough();

// ── Send ─────────────────────────────────────────────

export const sendResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});
