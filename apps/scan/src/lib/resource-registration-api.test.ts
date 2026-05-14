import { beforeEach, describe, expect, it, vi } from 'vitest';

import { probeX402Endpoint } from '@/lib/discovery/probe';
import { registerResourcesFromDiscovery } from '@/lib/discovery/register-origin';
import { registerResource } from '@/lib/resources';
import { fetchDiscoveryDocument } from '@/services/discovery';

import { registerOrigin, registerResourceUrl } from './resource-registration-api';

vi.mock('@/lib/discovery/probe', () => ({
  probeX402Endpoint: vi.fn(),
}));

vi.mock('@/lib/discovery/register-origin', () => ({
  registerResourcesFromDiscovery: vi.fn(),
}));

vi.mock('@/lib/resources', () => ({
  registerResource: vi.fn(),
}));

vi.mock('@/services/discovery', () => ({
  fetchDiscoveryDocument: vi.fn(),
}));

const mockProbeX402Endpoint = vi.mocked(probeX402Endpoint);
const mockRegisterResource = vi.mocked(registerResource);
const mockFetchDiscoveryDocument = vi.mocked(fetchDiscoveryDocument);
const mockRegisterResourcesFromDiscovery = vi.mocked(
  registerResourcesFromDiscovery
);

describe('registerResourceUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('probes, registers, and reports related discovery resources', async () => {
    mockProbeX402Endpoint.mockResolvedValue({
      success: true,
      advisory: {
        method: 'POST',
        paymentOptions: [],
      },
    } as never);
    mockRegisterResource.mockResolvedValue({
      success: true,
      resource: { resource: { id: 'resource-id' } },
      accepts: [],
    } as never);
    mockFetchDiscoveryDocument.mockResolvedValue({
      success: true,
      source: 'well-known',
      resources: [
        { url: 'https://seller.example/api/price' },
        { url: 'https://seller.example/api/quote' },
      ],
    } as never);

    const result = await registerResourceUrl({
      url: 'https://seller.example/api/price',
    });

    expect(mockProbeX402Endpoint).toHaveBeenCalledWith(
      'https://seller.example/api/price'
    );
    expect(mockRegisterResource).toHaveBeenCalledWith(
      'https://seller.example/api/price',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toMatchObject({
      success: true,
      methodUsed: 'POST',
      discovery: {
        found: true,
        otherResourceCount: 1,
        resources: ['https://seller.example/api/quote'],
      },
    });
  });

  it('returns a no402 error without writing when probing fails', async () => {
    mockProbeX402Endpoint.mockResolvedValue({
      success: false,
      error: 'Expected 402, got 200',
    } as never);

    const result = await registerResourceUrl({
      url: 'https://seller.example/free',
    });

    expect(result).toEqual({
      success: false,
      error: { type: 'no402' },
    });
    expect(mockRegisterResource).not.toHaveBeenCalled();
  });
});

describe('registerOrigin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers all resources from an origin discovery document', async () => {
    mockFetchDiscoveryDocument.mockResolvedValue({
      success: true,
      source: 'openapi',
      resources: [{ url: 'https://seller.example/api/price' }],
    } as never);
    mockRegisterResourcesFromDiscovery.mockResolvedValue({
      registered: 1,
      failed: [],
      skipped: [],
    } as never);

    const result = await registerOrigin({
      origin: 'https://seller.example',
    });

    expect(mockRegisterResourcesFromDiscovery).toHaveBeenCalledWith(
      [{ url: 'https://seller.example/api/price' }],
      'openapi'
    );
    expect(result).toMatchObject({ success: true, registered: 1 });
  });

  it('returns noDiscovery when the origin has no discovery document', async () => {
    mockFetchDiscoveryDocument.mockResolvedValue({
      success: false,
      error: 'No discovery document found',
    } as never);

    const result = await registerOrigin({
      origin: 'https://seller.example',
    });

    expect(result).toEqual({
      success: false,
      error: {
        type: 'noDiscovery',
        message: 'No discovery document found',
      },
    });
    expect(mockRegisterResourcesFromDiscovery).not.toHaveBeenCalled();
  });
});

