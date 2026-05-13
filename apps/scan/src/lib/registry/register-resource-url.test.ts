import { beforeEach, describe, expect, it, vi } from 'vitest';

import { probeX402Endpoint } from '@/lib/discovery/probe';
import { registerResource } from '@/lib/resources';
import { fetchDiscoveryDocument } from '@/services/discovery';

import { registerResourceUrl } from './register-resource-url';

import type { EndpointMethodAdvisory } from '@agentcash/discovery';

vi.mock('@/lib/discovery/probe', () => ({
  probeX402Endpoint: vi.fn(),
}));

vi.mock('@/lib/resources', () => ({
  registerResource: vi.fn(),
}));

vi.mock('@/services/discovery', () => ({
  fetchDiscoveryDocument: vi.fn(),
}));

const probeX402EndpointMock = vi.mocked(probeX402Endpoint);
const registerResourceMock = vi.mocked(registerResource);
const fetchDiscoveryDocumentMock = vi.mocked(fetchDiscoveryDocument);

const advisory = {
  source: 'probe',
  method: 'POST',
  paymentOptions: [{ protocol: 'x402' }],
  inputSchema: { input: { method: 'POST' } },
  paymentRequiredBody: { accepts: [] },
} as unknown as EndpointMethodAdvisory;

type RegisterResourceResult = Awaited<ReturnType<typeof registerResource>>;

function successfulRegistration(): RegisterResourceResult {
  return {
    success: true,
    resource: {
      resource: { id: 'resource-id', resource: 'https://example.com/api/pay' },
      origin: { id: 'origin-id' },
      accepts: [],
      unsupportedAccepts: [],
    },
    accepts: [],
    response: { accepts: [] },
    registrationDetails: {
      providedAccepts: [],
      supportedAccepts: [],
      unsupportedAccepts: [],
      originMetadata: {
        title: null,
        description: null,
        favicon: null,
        ogImages: [],
      },
    },
  } as unknown as RegisterResourceResult;
}

describe('registerResourceUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects local and private URLs before probing', async () => {
    const result = await registerResourceUrl('http://127.0.0.1:3000/pay');

    expect(result).toEqual({
      success: false,
      error: {
        type: 'unsupportedUrl',
        message: 'Local and private network URLs are not supported',
      },
    });
    expect(probeX402EndpointMock).not.toHaveBeenCalled();
    expect(registerResourceMock).not.toHaveBeenCalled();
  });

  it('rejects invalid URLs before probing', async () => {
    const result = await registerResourceUrl('not a url');

    expect(result).toEqual({
      success: false,
      error: {
        type: 'unsupportedUrl',
        message: 'Invalid URL',
      },
    });
    expect(probeX402EndpointMock).not.toHaveBeenCalled();
    expect(registerResourceMock).not.toHaveBeenCalled();
  });

  it('returns no402 when probing cannot find a payment challenge', async () => {
    probeX402EndpointMock.mockResolvedValue({
      success: false,
      error: 'Endpoint did not return a 402 payment challenge',
    });

    const result = await registerResourceUrl('https://example.com/api/pay');

    expect(result).toEqual({
      success: false,
      error: {
        type: 'no402',
        message: 'Endpoint did not return a 402 payment challenge',
      },
    });
    expect(registerResourceMock).not.toHaveBeenCalled();
  });

  it('probes template URLs safely but preserves the registered URL', async () => {
    probeX402EndpointMock.mockResolvedValue({
      success: true,
      advisory,
      warnings: [],
    });
    registerResourceMock.mockResolvedValue(successfulRegistration());
    fetchDiscoveryDocumentMock.mockResolvedValue({
      success: false,
      resources: [],
      error: 'No discovery document found',
    });

    const result = await registerResourceUrl(
      'https://example.com/api/resource/{id}'
    );

    expect(result.success).toBe(true);
    expect(probeX402EndpointMock).toHaveBeenCalledWith(
      'https://example.com/api/resource/id'
    );
    expect(registerResourceMock).toHaveBeenCalledWith(
      'https://example.com/api/resource/{id}',
      advisory
    );
  });

  it('includes other resources discovered from the same origin', async () => {
    probeX402EndpointMock.mockResolvedValue({
      success: true,
      advisory,
      warnings: [],
    });
    registerResourceMock.mockResolvedValue(successfulRegistration());
    fetchDiscoveryDocumentMock.mockResolvedValue({
      success: true,
      source: 'openapi',
      resources: [
        { url: 'https://example.com/api/pay' },
        { url: 'https://example.com/api/other' },
      ],
      ownershipProofs: [],
    });

    const result = await registerResourceUrl('https://example.com/api/pay');

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.methodUsed).toBe('POST');
    expect(result.discovery).toEqual({
      found: true,
      source: 'openapi',
      otherResourceCount: 1,
      origin: 'https://example.com',
      resources: ['https://example.com/api/other'],
    });
  });

  it('maps registration parser failures without duplicating parser logic', async () => {
    probeX402EndpointMock.mockResolvedValue({
      success: true,
      advisory,
      warnings: [],
    });
    registerResourceMock.mockResolvedValue({
      success: false,
      data: { accepts: [] },
      error: {
        type: 'parseResponse',
        parseErrors: ['Missing input schema'],
      },
    });

    const result = await registerResourceUrl('https://example.com/api/pay');

    expect(result).toEqual({
      success: false,
      data: { accepts: [] },
      error: {
        type: 'parseErrors',
        parseErrors: ['Missing input schema'],
      },
    });
  });
});
