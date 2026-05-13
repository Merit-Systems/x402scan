import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerResourcesFromDiscovery } from '@/lib/discovery/register-origin';
import { fetchDiscoveryDocument } from '@/services/discovery';

import { handleRegistryRegisterOrigin } from './registry-register-origin';

import type { RegisterOriginResult } from '@/lib/discovery/register-origin';

vi.mock('@/services/discovery', () => ({
  fetchDiscoveryDocument: vi.fn(),
}));

vi.mock('@/lib/discovery/register-origin', () => ({
  registerResourcesFromDiscovery: vi.fn(),
}));

const fetchDiscoveryDocumentMock = vi.mocked(fetchDiscoveryDocument);
const registerResourcesFromDiscoveryMock = vi.mocked(
  registerResourcesFromDiscovery
);

async function responseJson(
  response: Response
): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function originResult(
  overrides: Partial<RegisterOriginResult> = {}
): RegisterOriginResult {
  return {
    registered: 1,
    siwx: 0,
    failed: 0,
    skipped: 0,
    deprecated: 0,
    total: 1,
    source: 'openapi',
    failedDetails: [],
    siwxDetails: [],
    skippedDetails: [],
    originId: 'origin-id',
    ...overrides,
  };
}

describe('handleRegistryRegisterOrigin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when discovery is unavailable', async () => {
    fetchDiscoveryDocumentMock.mockResolvedValue({
      success: false,
      resources: [],
      error: 'No discovery document found',
    });

    const response = await handleRegistryRegisterOrigin({
      origin: 'https://example.com',
    });

    expect(response.status).toBe(404);
    expect(await responseJson(response)).toEqual({
      success: false,
      error: {
        type: 'no_discovery',
        message: 'No discovery document found',
      },
    });
    expect(registerResourcesFromDiscoveryMock).not.toHaveBeenCalled();
  });

  it('returns 422 when discovery has no registerable resources', async () => {
    fetchDiscoveryDocumentMock.mockResolvedValue({
      success: true,
      source: 'openapi',
      resources: [{ url: 'https://example.com/api/pay' }],
      ownershipProofs: [],
    });
    registerResourcesFromDiscoveryMock.mockResolvedValue(
      originResult({
        registered: 0,
        failed: 1,
        total: 1,
        failedDetails: [
          {
            url: 'https://example.com/api/pay',
            error: 'Missing input schema',
          },
        ],
      })
    );

    const response = await handleRegistryRegisterOrigin({
      origin: 'https://example.com',
    });

    expect(response.status).toBe(422);
    expect(await responseJson(response)).toEqual({
      success: false,
      error: {
        type: 'no_valid_resources',
        message:
          'No valid paid x402 resources were found for this origin. Add at least one paid x402 resource that passes validation to complete registration.',
      },
      result: {
        registered: 0,
        siwx: 0,
        failed: 1,
        skipped: 0,
        deprecated: 0,
        total: 1,
        source: 'openapi',
        failedDetails: [
          {
            url: 'https://example.com/api/pay',
            error: 'Missing input schema',
          },
        ],
        siwxDetails: [],
        skippedDetails: [],
        originId: 'origin-id',
      },
    });
  });

  it('returns registration counts and details on success', async () => {
    fetchDiscoveryDocumentMock.mockResolvedValue({
      success: true,
      source: 'well-known',
      resources: [
        { url: 'https://example.com/api/pay' },
        { url: 'https://example.com/api/me', authMode: 'siwx' },
      ],
      ownershipProofs: [],
    });
    registerResourcesFromDiscoveryMock.mockResolvedValue(
      originResult({
        registered: 1,
        siwx: 1,
        total: 2,
        source: 'well-known',
        siwxDetails: [{ url: 'https://example.com/api/me' }],
      })
    );

    const response = await handleRegistryRegisterOrigin({
      origin: 'https://example.com',
    });

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toEqual({
      success: true,
      registered: 1,
      siwx: 1,
      failed: 0,
      skipped: 0,
      deprecated: 0,
      total: 2,
      source: 'well-known',
      siwxDetails: [{ url: 'https://example.com/api/me' }],
    });
  });
});
