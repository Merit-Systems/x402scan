import z from 'zod';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';

import {
  walletTransactionsQuerySchema,
  walletStatsQuerySchema,
  merchantsListQuerySchema,
  merchantTransactionsQuerySchema,
  merchantStatsQuerySchema,
  facilitatorsListQuerySchema,
  facilitatorStatsQuerySchema,
  resourcesListQuerySchema,
  resourcesSearchQuerySchema,
  originResourcesQuerySchema,
  registryRegisterBodySchema,
  registryRegisterOriginBodySchema,
  registryOriginQuerySchema,
} from './schemas';

/** Convert a Zod schema to a JSON Schema object for the bazaar inputSchema field. */
function inputSchemaFrom(schema: z.ZodType) {
  return z.toJSONSchema(schema, { io: 'input' });
}

// ── Wallet endpoints ─────────────────────────────────

export const walletTransactionsExtension = declareDiscoveryExtension({
  input: { page: 0, page_size: 10, sort_by: 'time', sort_order: 'desc' },
  inputSchema: inputSchemaFrom(walletTransactionsQuerySchema),
  output: {
    example: {
      data: [
        {
          sender: '0x1234...abcd',
          recipient: '0x5678...efgh',
          amount: 1.5,
          chain: 'base',
          block_timestamp: '2025-01-01T00:00:00Z',
        },
      ],
      pagination: { page: 0, page_size: 10, has_next_page: true },
    },
  },
});

export const walletStatsExtension = declareDiscoveryExtension({
  input: {},
  inputSchema: inputSchemaFrom(walletStatsQuerySchema),
  output: {
    example: {
      data: {
        total_transactions: 42,
        total_amount: 1234.56,
        unique_recipients: 15,
        chains: ['base', 'solana'],
      },
    },
  },
});

// ── Merchant endpoints ───────────────────────────────

export const merchantsListExtension = declareDiscoveryExtension({
  input: { page: 0, page_size: 10, sort_by: 'volume' },
  inputSchema: inputSchemaFrom(merchantsListQuerySchema),
  output: {
    example: {
      data: [
        {
          recipient: '0x5678...efgh',
          tx_count: 100,
          total_amount: 5000.0,
          unique_buyers: 42,
          chains: ['base'],
        },
      ],
      pagination: { page: 0, page_size: 10, has_next_page: true },
    },
  },
});

export const merchantTransactionsExtension = declareDiscoveryExtension({
  input: { page: 0, page_size: 10, sort_by: 'time', sort_order: 'desc' },
  inputSchema: inputSchemaFrom(merchantTransactionsQuerySchema),
  output: {
    example: {
      data: [
        {
          sender: '0x1234...abcd',
          recipient: '0x5678...efgh',
          amount: 1.5,
          chain: 'base',
          block_timestamp: '2025-01-01T00:00:00Z',
        },
      ],
      pagination: { page: 0, page_size: 10, has_next_page: true },
    },
  },
});

export const merchantStatsExtension = declareDiscoveryExtension({
  input: {},
  inputSchema: inputSchemaFrom(merchantStatsQuerySchema),
  output: {
    example: {
      data: {
        total_transactions: 1234,
        total_amount: 56789.01,
        unique_buyers: 42,
        unique_sellers: 1,
        latest_block_timestamp: '2025-01-01T00:00:00Z',
      },
    },
  },
});

// ── Facilitator endpoints ────────────────────────────

export const facilitatorsListExtension = declareDiscoveryExtension({
  input: { page: 0, page_size: 10 },
  inputSchema: inputSchemaFrom(facilitatorsListQuerySchema),
  output: {
    example: {
      data: [
        {
          facilitator_id: 'coinbase',
          tx_count: 500,
          total_amount: 25000.0,
          unique_buyers: 100,
          unique_sellers: 50,
          chains: ['base', 'solana'],
        },
      ],
      pagination: { page: 0, page_size: 10, has_next_page: true },
    },
  },
});

export const facilitatorStatsExtension = declareDiscoveryExtension({
  input: {},
  inputSchema: inputSchemaFrom(facilitatorStatsQuerySchema),
  output: {
    example: {
      data: {
        total_transactions: 5000,
        total_amount: 250000.0,
        unique_buyers: 1000,
        unique_sellers: 200,
        latest_block_timestamp: '2025-01-01T00:00:00Z',
      },
    },
  },
});

// ── Resource endpoints ───────────────────────────────

export const resourcesListExtension = declareDiscoveryExtension({
  input: { page: 0, page_size: 10 },
  inputSchema: inputSchemaFrom(resourcesListQuerySchema),
  output: {
    example: {
      data: [
        {
          id: 'res_123',
          resource: 'https://example.com/api/data',
          origin: 'example.com',
          x402Version: 2,
        },
      ],
      pagination: { page: 0, page_size: 10, has_next_page: true },
    },
  },
});

export const resourcesSearchExtension = declareDiscoveryExtension({
  input: { q: 'search query', page: 0, page_size: 10 },
  inputSchema: inputSchemaFrom(resourcesSearchQuerySchema),
  output: {
    example: {
      data: [
        {
          id: 'res_123',
          resource: 'https://example.com/api/data',
          origin: 'example.com',
        },
      ],
      pagination: { page: 0, page_size: 10, has_next_page: true },
    },
  },
});

export const originResourcesExtension = declareDiscoveryExtension({
  input: { page: 0, page_size: 10 },
  inputSchema: inputSchemaFrom(originResourcesQuerySchema),
  output: {
    example: {
      data: [
        {
          id: 'res_123',
          resource: 'https://example.com/api/data',
          x402Version: 2,
        },
      ],
      pagination: { page: 0, page_size: 10, has_next_page: true },
    },
  },
});

// ── Registry endpoints ─────────────────────────────

export const registryRegisterExtension = declareDiscoveryExtension({
  input: { url: 'https://example.com/api/endpoint' },
  inputSchema: inputSchemaFrom(registryRegisterBodySchema),
  output: {
    example: {
      success: true,
      resource: {
        id: 'res_123',
        resource: 'https://example.com/api/endpoint',
        x402Version: 2,
      },
      accepts: [
        {
          network: 'base',
          payTo: '0x1234...abcd',
          maxAmountRequired: '0.01',
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        },
      ],
    },
  },
});

export const registryRegisterOriginExtension = declareDiscoveryExtension({
  input: { origin: 'https://example.com' },
  inputSchema: inputSchemaFrom(registryRegisterOriginBodySchema),
  output: {
    example: {
      success: true,
      registered: 5,
      failed: 0,
      deprecated: 1,
      total: 5,
      source: 'well-known',
    },
  },
});

export const registryOriginExtension = declareDiscoveryExtension({
  input: { url: 'https://example.com', page: 0, page_size: 10 },
  inputSchema: inputSchemaFrom(registryOriginQuerySchema),
  output: {
    example: {
      data: [
        {
          id: 'res_123',
          resource: 'https://example.com/api/endpoint',
          x402Version: 2,
        },
      ],
      pagination: { page: 0, page_size: 10, has_next_page: true },
    },
  },
});
