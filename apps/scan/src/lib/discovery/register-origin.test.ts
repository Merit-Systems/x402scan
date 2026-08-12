import { beforeEach, describe, expect, it, vi } from 'vitest';

import { probeX402Endpoint } from './probe';
import { registerResourcesFromDiscovery } from './register-origin';
import { registerFreeResource, registerResource } from '@/lib/resources';
import { deprecateStaleResources } from '@/services/db/resources/resource';
import { getOriginResourceCount } from '@/services/db/resources/origin';

vi.mock('./probe', () => ({
  probeX402Endpoint: vi.fn((url: string) =>
    Promise.resolve({
      success: true,
      advisory: {
        url,
        method: 'POST',
        authMode: 'paid',
        accepts: [],
      },
      warnings: [],
    })
  ),
}));

vi.mock('./probe-cache', () => ({
  getCachedProbeResult: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('./utils', () => ({
  getRegistrationErrorMessage: (error: { type: string }) => error.type,
}));

vi.mock('@/lib/resources', () => ({
  registerResource: vi.fn((url: string) =>
    Promise.resolve({
      success: true,
      resource: { id: 'res-1', origin: { id: 'origin-1' }, url },
      warnings: [],
      registrationDetails: {
        originMetadata: { title: 'Telemost', description: 'Video API' },
      },
    })
  ),
  registerFreeResource: vi.fn((url: string) =>
    Promise.resolve({
      success: true,
      resource: { id: 'res-free', origin: { id: 'origin-1' }, url },
    })
  ),
}));

vi.mock('@/services/db/resources/resource', () => ({
  deprecateStaleResources: vi.fn(() => Promise.resolve(0)),
}));

vi.mock('@/services/db/resources/origin', () => ({
  getOriginResourceCount: vi.fn(() => Promise.resolve(5)),
  upsertOrigin: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock('@/lib/discord-notifications', () => ({
  notifyNewServer: vi.fn(),
}));

vi.mock('@/services/scraper', () => ({
  scrapeOriginData: vi.fn(() =>
    Promise.resolve({ og: null, metadata: null, favicon: null })
  ),
}));

const ORIGIN = 'https://api.telemost.io';

describe('registerResourcesFromDiscovery — catalog registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers openapi security:[] endpoints as public catalog rows', async () => {
    // Telemost shape: a paid endpoint plus /v1/catalog, which the discovery
    // package classified `unprotected` because the OpenAPI operation declares
    // `security: []`. The openapi source only ever emits `unprotected` for
    // that explicit declaration.
    const result = await registerResourcesFromDiscovery(
      [
        { url: `${ORIGIN}/v1/rooms`, method: 'POST', authMode: 'paid' },
        { url: `${ORIGIN}/v1/catalog`, method: 'GET', authMode: 'unprotected' },
      ],
      'openapi'
    );

    expect(result.registered).toBe(1);
    expect(result.publicCount).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.publicDetails).toEqual([
      expect.objectContaining({ url: `${ORIGIN}/v1/catalog` }),
    ]);
    expect(registerFreeResource).toHaveBeenCalledWith(
      `${ORIGIN}/v1/catalog`,
      expect.objectContaining({ authMode: 'unprotected' })
    );
  });

  it('registers openapi apiKey endpoints as catalog rows', async () => {
    const result = await registerResourcesFromDiscovery(
      [
        { url: `${ORIGIN}/v1/rooms`, method: 'POST', authMode: 'paid' },
        { url: `${ORIGIN}/v1/admin`, method: 'POST', authMode: 'apiKey' },
      ],
      'openapi'
    );

    expect(result.registered).toBe(1);
    expect(result.apiKeyCount).toBe(1);
    expect(result.skipped).toBe(0);
    expect(registerFreeResource).toHaveBeenCalledWith(
      `${ORIGIN}/v1/admin`,
      expect.objectContaining({ authMode: 'apiKey' })
    );
  });

  it('still skips unprotected and apiKey endpoints from non-openapi sources', async () => {
    const result = await registerResourcesFromDiscovery(
      [
        { url: `${ORIGIN}/v1/catalog`, method: 'GET', authMode: 'unprotected' },
        { url: `${ORIGIN}/v1/admin`, method: 'POST', authMode: 'apiKey' },
      ],
      'well-known'
    );

    expect(result.skipped).toBe(2);
    expect(result.publicCount).toBe(0);
    expect(result.apiKeyCount).toBe(0);
    expect(registerFreeResource).not.toHaveBeenCalled();
  });

  it('registers siwx endpoints as before', async () => {
    const result = await registerResourcesFromDiscovery(
      [{ url: `${ORIGIN}/v1/me`, method: 'GET', authMode: 'siwx' }],
      'openapi'
    );

    expect(result.siwx).toBe(1);
    expect(registerFreeResource).toHaveBeenCalledWith(
      `${ORIGIN}/v1/me`,
      expect.objectContaining({ authMode: 'siwx' })
    );
  });

  it('skips catalog rows for a catalog-only batch even when the origin already has resources', async () => {
    // getOriginResourceCount mock defaults to 5 — the origin exists, but a
    // batch with no paid/siwx SUCCESS must not register catalog rows: doing
    // so would set originId and let deprecation wipe the existing paid rows
    // whenever probes fail transiently.
    const result = await registerResourcesFromDiscovery(
      [
        { url: `${ORIGIN}/v1/catalog`, method: 'GET', authMode: 'unprotected' },
        { url: `${ORIGIN}/v1/admin`, method: 'POST', authMode: 'apiKey' },
      ],
      'openapi'
    );

    expect(result.publicCount).toBe(0);
    expect(result.apiKeyCount).toBe(0);
    expect(result.skipped).toBe(2);
    expect(registerFreeResource).not.toHaveBeenCalled();
    expect(deprecateStaleResources).not.toHaveBeenCalled();
  });

  it('reports a failed free registration in failedDetails', async () => {
    vi.mocked(registerFreeResource).mockResolvedValueOnce({
      success: false,
      error: 'Database error',
    } as Awaited<ReturnType<typeof registerFreeResource>>);

    const result = await registerResourcesFromDiscovery(
      [
        { url: `${ORIGIN}/v1/rooms`, method: 'POST', authMode: 'paid' },
        { url: `${ORIGIN}/v1/catalog`, method: 'GET', authMode: 'unprotected' },
      ],
      'openapi'
    );

    expect(result.registered).toBe(1);
    expect(result.publicCount).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.failedDetails).toEqual([
      expect.objectContaining({
        url: `${ORIGIN}/v1/catalog`,
        error: 'Database error',
      }),
    ]);
  });

  it('skips catalog rows when the origin has no paid/siwx resources at all', async () => {
    vi.mocked(getOriginResourceCount).mockResolvedValueOnce(0);

    const result = await registerResourcesFromDiscovery(
      [
        { url: `${ORIGIN}/v1/catalog`, method: 'GET', authMode: 'unprotected' },
        { url: `${ORIGIN}/v1/admin`, method: 'POST', authMode: 'apiKey' },
      ],
      'openapi'
    );

    expect(result.publicCount).toBe(0);
    expect(result.apiKeyCount).toBe(0);
    expect(result.skipped).toBe(2);
    expect(registerFreeResource).not.toHaveBeenCalled();
  });

  it('does not register catalog rows or deprecate when every paid probe fails', async () => {
    // Regression: transient probe failures (5xx, rate limit) on an existing
    // origin must not let catalog rows register and then deprecate the
    // origin's paid rows.
    vi.mocked(probeX402Endpoint).mockResolvedValueOnce({
      success: false,
      error: 'HTTP 503',
    } as Awaited<ReturnType<typeof probeX402Endpoint>>);

    const result = await registerResourcesFromDiscovery(
      [
        { url: `${ORIGIN}/v1/rooms`, method: 'POST' },
        { url: `${ORIGIN}/v1/catalog`, method: 'GET', authMode: 'unprotected' },
      ],
      'openapi'
    );

    expect(result.failed).toBe(1);
    expect(result.publicCount).toBe(0);
    expect(result.skipped).toBe(1);
    expect(deprecateStaleResources).not.toHaveBeenCalled();
  });

  it('includes catalog rows in the deprecation active list', async () => {
    await registerResourcesFromDiscovery(
      [
        { url: `${ORIGIN}/v1/rooms`, method: 'POST', authMode: 'paid' },
        { url: `${ORIGIN}/v1/catalog`, method: 'GET', authMode: 'unprotected' },
        { url: `${ORIGIN}/v1/admin`, method: 'POST', authMode: 'apiKey' },
        { url: `${ORIGIN}/v1/me`, method: 'GET', authMode: 'siwx' },
      ],
      'openapi'
    );

    expect(deprecateStaleResources).toHaveBeenCalledWith(
      'origin-1',
      expect.arrayContaining([
        { url: `${ORIGIN}/v1/rooms`, method: 'POST' },
        { url: `${ORIGIN}/v1/catalog`, method: 'GET' },
        { url: `${ORIGIN}/v1/admin`, method: 'POST' },
        { url: `${ORIGIN}/v1/me`, method: 'GET' },
      ])
    );
  });

  it('passes endpoint descriptions through to free and paid registration', async () => {
    await registerResourcesFromDiscovery(
      [
        {
          url: `${ORIGIN}/v1/rooms`,
          method: 'POST',
          authMode: 'paid',
          description: 'Create a video room',
        },
        {
          url: `${ORIGIN}/v1/catalog`,
          method: 'GET',
          authMode: 'unprotected',
          description: 'Lists purchasable records',
        },
        {
          url: `${ORIGIN}/v1/me`,
          method: 'GET',
          authMode: 'siwx',
          description: 'Current identity',
        },
      ],
      'openapi'
    );

    expect(registerFreeResource).toHaveBeenCalledWith(
      `${ORIGIN}/v1/catalog`,
      expect.objectContaining({ description: 'Lists purchasable records' })
    );
    expect(registerFreeResource).toHaveBeenCalledWith(
      `${ORIGIN}/v1/me`,
      expect.objectContaining({ description: 'Current identity' })
    );
    expect(registerResource).toHaveBeenCalledWith(
      `${ORIGIN}/v1/rooms`,
      expect.anything(),
      expect.objectContaining({ description: 'Create a video room' })
    );
  });

  it('reports mixed batch totals', async () => {
    const result = await registerResourcesFromDiscovery(
      [
        { url: `${ORIGIN}/v1/rooms`, method: 'POST', authMode: 'paid' },
        { url: `${ORIGIN}/v1/catalog`, method: 'GET', authMode: 'unprotected' },
        { url: `${ORIGIN}/v1/admin`, method: 'POST', authMode: 'apiKey' },
      ],
      'openapi'
    );

    expect(result.registered).toBe(1);
    expect(result.publicCount).toBe(1);
    expect(result.apiKeyCount).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(3);
  });
});
