import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getL3ForProbe } from '@agentcash/discovery';

import { registerResource, validateResource } from './resources';
import { upsertResource } from '@/services/db/resources/resource';
import { listOriginsWithResources } from '@/services/db/resources/origin';
import { upsertResourceResponse } from '@/services/db/resources/response';
import { Chain } from '@/types/chain';

import type { EndpointMethodAdvisory } from '@agentcash/discovery';

// Only the Prisma client and side-effecting services are mocked; validation,
// chain normalization, registration filtering and the upsert schema/filter
// all run for real.
const db = vi.hoisted(() => {
  const tx = {
    $executeRaw: vi.fn(),
    resources: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    accepts: {
      upsert: vi.fn(),
    },
  };
  return {
    tx,
    scanDb: {
      $transaction: vi.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
      resourceOrigin: { findMany: vi.fn() },
    },
  };
});

vi.mock('@x402scan/scan-db', () => ({ scanDb: db.scanDb }));
vi.mock('@/env', () => ({ env: {} }));
vi.mock('@/lib/redis', () => ({ getRedisClient: () => null }));
vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('@/lib/discord-notifications', () => ({ notifyNewServer: vi.fn() }));
vi.mock('@/services/scraper', () => ({ scrapeOriginData: vi.fn() }));
vi.mock('@/services/discovery', () => ({ fetchDiscoveryDocument: vi.fn() }));
vi.mock('@/services/verification/accepts-verification', () => ({
  verifyAcceptsOwnership: vi.fn(),
}));
vi.mock('@/services/db/resources/response', () => ({
  upsertResourceResponse: vi.fn(),
}));

const RESOURCE_URL = 'https://api.priors.trade/v1/score/462';
const USDG = '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168';
const PAY_TO = '0x949206e4aF666C9FA5BfD527c7822358dB648Cf8';

const robinhoodAccept = {
  scheme: 'exact',
  network: 'eip155:4663',
  amount: '30000',
  asset: USDG,
  payTo: PAY_TO,
  maxTimeoutSeconds: 300,
  extra: { name: 'Global Dollar', version: '1' },
};

// Decoded PAYMENT-REQUIRED header of `GET https://api.priors.trade/v1/score/462`
// (Merit-Systems/x402scan#1292).
const liveChallenge = {
  x402Version: 2,
  error: 'Payment required',
  resource: {
    url: RESOURCE_URL,
    description:
      'Priors score of one ERC-8004 agent, with its default and freeze flags, and the Priors Score v2 breakdown (rung, components, x402 income) when published',
    mimeType: 'application/json',
    serviceName: 'Priors',
  },
  accepts: [robinhoodAccept],
};

/** Builds the advisory the same way probing does, from a raw 402 body. */
function advisoryFor(
  paymentRequiredBody: typeof liveChallenge
): EndpointMethodAdvisory {
  const l3 = getL3ForProbe(
    [
      {
        path: '/v1/score/462',
        method: 'GET',
        authHint: 'paid',
        protocols: ['x402'],
        paymentRequiredBody,
      },
    ],
    '/v1/score/462',
    'GET'
  );
  if (!l3) throw new Error('probe produced no advisory');
  return {
    ...l3,
    method: 'GET',
    // Supplied by the origin's OpenAPI document in a real registration.
    inputSchema: {
      parameters: [
        {
          name: 'agentId',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
    },
  };
}

const register = (advisory: EndpointMethodAdvisory) =>
  registerResource(RESOURCE_URL, advisory, {
    method: 'GET',
    notifyNewServer: false,
    skipMetadataScrape: true,
  });

beforeEach(() => {
  vi.clearAllMocks();
  db.tx.resources.findUnique.mockResolvedValue(null);
  db.tx.resources.upsert.mockImplementation(
    ({ create }: { create: { resource: string } }) =>
      Promise.resolve({
        id: 'resource-1',
        ...create,
        origin: { id: 'origin-1', origin: 'https://api.priors.trade' },
      })
  );
  db.tx.accepts.upsert.mockImplementation(
    ({ create }: { create: { network: string } }) =>
      Promise.resolve({ id: `accept-${create.network}`, ...create })
  );
});

describe('Robinhood Chain (eip155:4663) registration', () => {
  it('registers the live v2 challenge and lists it under robinhood', async () => {
    const advisory = advisoryFor(liveChallenge);

    expect(validateResource(RESOURCE_URL, advisory)).toEqual(
      expect.objectContaining({ valid: true })
    );

    const result = await register(advisory);

    expect(result.success).toBe(true);
    expect(db.tx.accepts.upsert).toHaveBeenCalledTimes(1);
    expect(db.tx.accepts.upsert.mock.calls[0]?.[0].create).toEqual(
      expect.objectContaining({
        scheme: 'exact',
        network: 'robinhood',
        asset: USDG,
        payTo: PAY_TO.toLowerCase(),
        maxAmountRequired: 30000n,
        maxTimeoutSeconds: 300,
      })
    );

    // Listing: the stored 402 body still parses, and the accepts filter for
    // both the default view and the robinhood network view admits the row.
    const storedResponse = vi.mocked(upsertResourceResponse).mock.calls[0]?.[1];
    expect(storedResponse).toEqual(liveChallenge);
    db.scanDb.resourceOrigin.findMany.mockResolvedValue([
      {
        id: 'origin-1',
        origin: 'https://api.priors.trade',
        ogImages: [],
        resources: [
          {
            id: 'resource-1',
            resource: RESOURCE_URL,
            metadata: null,
            accepts: [{ network: 'robinhood' }],
            response: { response: storedResponse },
            tags: [],
          },
        ],
      },
    ]);

    const listed = await listOriginsWithResources({});
    expect(listed[0]?.resources[0]?.success).toBe(true);
    const defaultWhere =
      db.scanDb.resourceOrigin.findMany.mock.calls[0]?.[0].include.resources
        .include.accepts.where;
    expect(defaultWhere.network.in).toContain('robinhood');

    await listOriginsWithResources({ chain: Chain.ROBINHOOD });
    const chainWhere =
      db.scanDb.resourceOrigin.findMany.mock.calls[1]?.[0].include.resources
        .include.accepts.where;
    expect(chainWhere.network).toBe('robinhood');
  });

  it('keeps the eip155:4663 option through normalization, registration and upsert next to an unsupported network', async () => {
    const polygonAccept = {
      ...robinhoodAccept,
      network: 'eip155:137',
      asset: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    };
    const advisory = advisoryFor({
      ...liveChallenge,
      accepts: [polygonAccept, robinhoodAccept],
    });

    expect(validateResource(RESOURCE_URL, advisory)).toEqual(
      expect.objectContaining({ valid: true })
    );

    const result = await register(advisory);
    if (!result.success) throw new Error('registration failed');

    // Registration: only the robinhood option is forwarded, untouched.
    expect(result.registrationDetails.providedAccepts).toEqual([
      expect.objectContaining({
        network: 'robinhood',
        asset: USDG,
        maxAmountRequired: '30000',
      }),
    ]);

    // Upsert: the robinhood row is written with the same asset and amount.
    expect(db.tx.accepts.upsert).toHaveBeenCalledTimes(1);
    expect(db.tx.accepts.upsert.mock.calls[0]?.[0].create).toEqual(
      expect.objectContaining({
        network: 'robinhood',
        asset: USDG,
        maxAmountRequired: 30000n,
      })
    );

    // The persistence filter on its own, fed both options: the unsupported
    // one is reported, the robinhood one is persisted.
    vi.clearAllMocks();
    const upserted = await upsertResource({
      resource: RESOURCE_URL,
      method: 'GET',
      type: 'http',
      x402Version: 2,
      lastUpdated: new Date(),
      accepts: [polygonAccept, robinhoodAccept].map(
        ({ amount, ...accept }) => ({
          ...accept,
          maxAmountRequired: amount,
        })
      ),
    });

    expect(upserted?.accepts.map(accept => accept.network)).toEqual([
      'robinhood',
    ]);
    expect(upserted?.unsupportedAccepts).toEqual([
      expect.objectContaining({ network: 'polygon' }),
    ]);
    expect(upserted?.accepts[0]).toEqual(
      expect.objectContaining({ asset: USDG, maxAmountRequired: 30000n })
    );
  });
});
