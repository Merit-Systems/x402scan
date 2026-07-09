import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerResourcesFromDiscovery } from './register-origin';

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
  registerSiwxResource: vi.fn((url: string) =>
    Promise.resolve({
      success: true,
      resource: { id: 'res-siwx', origin: { id: 'origin-1' }, url },
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

describe('registerResourcesFromDiscovery — skipped endpoint provenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks openapi security:[] endpoints as explicitly public in skippedDetails', async () => {
    // Telemost shape: a paid endpoint plus /v1/catalog, which the discovery
    // package classified `unprotected` because the OpenAPI operation declares
    // `security: []`. The openapi source only ever emits `unprotected` for
    // that explicit declaration — it must not surface as an actionable warning.
    const result = await registerResourcesFromDiscovery(
      [
        { url: `${ORIGIN}/v1/rooms`, method: 'POST', authMode: 'paid' },
        { url: `${ORIGIN}/v1/catalog`, method: 'GET', authMode: 'unprotected' },
      ],
      'openapi'
    );

    expect(result.registered).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.skippedDetails).toEqual([
      expect.objectContaining({
        url: `${ORIGIN}/v1/catalog`,
        explicitlyPublic: true,
      }),
    ]);
  });

  it('does not mark unprotected endpoints from non-openapi sources as explicitly public', async () => {
    const result = await registerResourcesFromDiscovery(
      [{ url: `${ORIGIN}/v1/catalog`, method: 'GET', authMode: 'unprotected' }],
      'well-known'
    );

    expect(result.skipped).toBe(1);
    expect(result.skippedDetails[0]?.explicitlyPublic).toBeFalsy();
  });

  it('does not mark apiKey endpoints as explicitly public even from openapi', async () => {
    const result = await registerResourcesFromDiscovery(
      [{ url: `${ORIGIN}/v1/admin`, method: 'POST', authMode: 'apiKey' }],
      'openapi'
    );

    expect(result.skipped).toBe(1);
    expect(result.skippedDetails[0]?.explicitlyPublic).toBeFalsy();
  });
});
