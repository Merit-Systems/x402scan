import { beforeEach, describe, expect, it, vi } from 'vitest';
import z from 'zod';

import { searchX402Tools } from './search-tools';

import type { Prisma } from '@x402scan/scan-db';

const db = vi.hoisted(() => ({
  scanDb: { resources: { findMany: vi.fn() } },
}));

vi.mock('@x402scan/scan-db', () => ({ scanDb: db.scanDb }));
vi.mock('@/env', () => ({ env: {} }));
vi.mock('@/lib/redis', () => ({ getRedisClient: () => null }));

// The part of Prisma's `resources.findMany` arguments the fake below can
// evaluate. Any other filter fails the parse, so the fake never silently
// ignores a condition of the query.
const acceptWhereSchema = z.strictObject({
  network: z.strictObject({ in: z.array(z.string()) }).optional(),
  payTo: z.strictObject({ not: z.string() }).optional(),
});
const resourceFilterSchema = z.strictObject({
  accepts: z
    .strictObject({
      some: acceptWhereSchema.optional(),
      none: acceptWhereSchema.optional(),
    })
    .optional(),
  metadata: z
    .strictObject({
      path: z.tuple([z.literal('authMode')]),
      equals: z.string(),
    })
    .optional(),
});
const findManyArgsSchema = z.object({
  where: resourceFilterSchema.extend({
    OR: z.array(resourceFilterSchema).optional(),
    NOT: resourceFilterSchema.optional(),
    // Every fixture resource is live: not excluded, not deprecated.
    excluded: z.strictObject({ is: z.null() }),
    deprecatedAt: z.null(),
  }),
  include: z.object({
    accepts: z.strictObject({ where: acceptWhereSchema }),
  }),
  take: z.number(),
});

type Network = 'base' | 'robinhood';

const acceptRow = (resource: string, network: Network) => ({
  scheme: 'exact',
  network,
  maxAmountRequired: 10000n,
  resource,
  description: `Score from ${resource}`,
  mimeType: 'application/json',
  payTo: '0x949206e4af666c9fa5bfd527c7822358db648cf8',
  maxTimeoutSeconds: 300,
  asset:
    network === 'base'
      ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      : '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
  outputSchema: { input: { type: 'http', method: 'GET' }, output: null },
  extra:
    network === 'base'
      ? { name: 'USD Coin', version: '2' }
      : { name: 'Global Dollar', version: '1' },
});

type AcceptRow = ReturnType<typeof acceptRow>;

const resourceRow = (id: string, networks: Network[], authMode?: string) => {
  const resource = `https://api.example.com/${id}`;
  return {
    id,
    resource,
    x402Version: 2,
    metadata: authMode === undefined ? null : { authMode },
    origin: { favicon: null },
    _count: { toolCalls: 0 },
    accepts: networks.map(network => acceptRow(resource, network)),
  };
};

type ResourceRow = ReturnType<typeof resourceRow>;

const acceptMatches = (
  accept: AcceptRow,
  where: z.infer<typeof acceptWhereSchema>
) =>
  (where.network === undefined || where.network.in.includes(accept.network)) &&
  (where.payTo === undefined || accept.payTo !== where.payTo.not);

const resourceMatches = (
  resource: ResourceRow,
  where: z.infer<typeof resourceFilterSchema>
) => {
  const some = where.accepts?.some;
  const none = where.accepts?.none;
  return (
    (some === undefined ||
      resource.accepts.some(accept => acceptMatches(accept, some))) &&
    (none === undefined ||
      !resource.accepts.some(accept => acceptMatches(accept, none))) &&
    (where.metadata === undefined ||
      resource.metadata?.authMode === where.metadata.equals)
  );
};

// Ranked as `searchResources` orders them (tool calls, then tags): more
// 4663-only resources than the limit come first.
const rankedResources = [
  resourceRow('robinhood-1', ['robinhood']),
  resourceRow('robinhood-2', ['robinhood']),
  resourceRow('robinhood-3', ['robinhood']),
  resourceRow('robinhood-4', ['robinhood']),
  resourceRow('base-1', ['base']),
  resourceRow('base-and-robinhood', ['base', 'robinhood']),
  resourceRow('free', [], 'siwx'),
  resourceRow('base-2', ['base']),
];

beforeEach(() => {
  vi.clearAllMocks();
  db.scanDb.resources.findMany.mockImplementation(
    (args: Prisma.ResourcesFindManyArgs) => {
      const { where, include, take } = findManyArgsSchema.parse(args);
      const { OR, NOT } = where;
      return Promise.resolve(
        rankedResources
          .filter(
            resource =>
              resourceMatches(resource, where) &&
              (OR === undefined ||
                OR.some(filter => resourceMatches(resource, filter))) &&
              (NOT === undefined || !resourceMatches(resource, NOT))
          )
          .slice(0, take)
          .map(resource => ({
            ...resource,
            accepts: resource.accepts.filter(accept =>
              acceptMatches(accept, include.accepts.where)
            ),
          }))
      );
    }
  );
});

describe('searchX402Tools', () => {
  it('returns `limit` payable tools when more 4663-only resources than the limit rank first', async () => {
    const tools = await searchX402Tools({
      limit: 3,
      showExcluded: false,
      showDeprecated: false,
    });

    expect(tools.map(tool => tool.id)).toEqual([
      'base-1',
      'base-and-robinhood',
      'free',
    ]);
    // The Base + 4663 resource stays, with its Base accept only.
    expect(tools[1]?.accepts.map(accept => accept.chain)).toEqual(['base']);
  });
});
