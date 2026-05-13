import { describe, expect, it, vi } from 'vitest';

import { registerResourceUrl } from '@/lib/registry/register-resource-url';

import { handleRegistryRegister } from './registry-register';

import type { RegisterResourceUrlResult } from '@/lib/registry/register-resource-url';

vi.mock('@/lib/registry/register-resource-url', () => ({
  registerResourceUrl: vi.fn(),
}));

const registerResourceUrlMock = vi.mocked(registerResourceUrl);

async function responseJson(
  response: Response
): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe('handleRegistryRegister', () => {
  it('returns 422 for unsupported URLs', async () => {
    registerResourceUrlMock.mockResolvedValue({
      success: false,
      error: {
        type: 'unsupportedUrl',
        message: 'Local and private network URLs are not supported',
      },
    });

    const response = await handleRegistryRegister({
      url: 'http://127.0.0.1:3000/pay',
    });

    expect(response.status).toBe(422);
    expect(await responseJson(response)).toEqual({
      success: false,
      error: {
        type: 'unsupported_url',
        message: 'Local and private network URLs are not supported',
      },
    });
  });

  it('returns 422 when no x402 challenge is found', async () => {
    registerResourceUrlMock.mockResolvedValue({
      success: false,
      error: {
        type: 'no402',
        message: 'Endpoint did not return a 402 payment challenge',
      },
    });

    const response = await handleRegistryRegister({
      url: 'https://example.com/api/free',
    });

    expect(response.status).toBe(422);
    expect(await responseJson(response)).toEqual({
      success: false,
      error: {
        type: 'no_402',
        message: 'Endpoint did not return a 402 payment challenge',
      },
    });
  });

  it('returns parse errors from the shared registration service', async () => {
    registerResourceUrlMock.mockResolvedValue({
      success: false,
      data: { accepts: [] },
      error: {
        type: 'parseErrors',
        parseErrors: ['Missing input schema'],
      },
    });

    const response = await handleRegistryRegister({
      url: 'https://example.com/api/pay',
    });

    expect(response.status).toBe(422);
    expect(await responseJson(response)).toEqual({
      success: false,
      error: {
        type: 'parse_error',
        parseErrors: ['Missing input schema'],
      },
      data: { accepts: [] },
    });
  });

  it('returns the public registration payload on success', async () => {
    registerResourceUrlMock.mockResolvedValue({
      success: true,
      resource: { resource: { id: 'resource-id' } },
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
      methodUsed: 'POST',
      discovery: {
        found: false,
        otherResourceCount: 0,
        origin: 'https://example.com',
      },
    } as unknown as RegisterResourceUrlResult);

    const response = await handleRegistryRegister({
      url: 'https://example.com/api/pay',
    });

    expect(response.status).toBe(200);
    expect(await responseJson(response)).toEqual({
      success: true,
      resource: { resource: { id: 'resource-id' } },
      accepts: [],
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
      methodUsed: 'POST',
      discovery: {
        found: false,
        otherResourceCount: 0,
        origin: 'https://example.com',
      },
    });
  });
});
