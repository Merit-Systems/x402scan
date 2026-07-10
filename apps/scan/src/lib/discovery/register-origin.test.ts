import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerResourcesFromDiscovery } from './register-origin';
import { registerFreeResource } from '@/lib/resources';
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
  getRegistrationErrorMessage: (error: unknown) => String(error),
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
