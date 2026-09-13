import {
  checkEndpointSchema,
  getOpenAPI,
  getWarningsForL3,
} from '@agentcash/discovery';
import type * as AgentcashDiscovery from '@agentcash/discovery';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { JsonObject } from '@/lib/json';

import parameterizedPathFixture from './__fixtures__/parameterized-path.openapi.json';
import { probeX402Endpoint } from './probe';

vi.mock('@agentcash/discovery', async importOriginal => {
  const actual = await importOriginal<typeof AgentcashDiscovery>();
  return {
    ...actual,
    checkEndpointSchema: vi.fn(),
    getOpenAPI: vi.fn(),
    getWarningsForL3: vi.fn(() => []),
  };
});

const templateUrl = 'https://api.example.test/v1/entity/{entityId}/profile';
const concreteUrl =
  'https://api.example.test/v1/entity/entity%3Aexample%3A12345/profile';

describe('probeX402Endpoint path-parameter examples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWarningsForL3).mockReturnValue([]);
  });

  it('probes the concrete example URL and never sends the literal template', async () => {
    mockOpenApi(parameterizedPathFixture);
    vi.mocked(checkEndpointSchema).mockImplementation(async options => {
      if (options.url === templateUrl) {
        return {
          found: false,
          origin: 'https://api.example.test',
          path: '/v1/entity/{entityId}/profile',
          cause: 'not_found',
          message: 'literal template rejected',
        };
      }
      return {
        found: true,
        origin: 'https://api.example.test',
        path: '/v1/entity/entity:example:12345/profile',
        advisories: [
          {
            source: 'probe',
            method: 'GET',
            paymentOptions: [
              {
                protocol: 'x402',
                version: 2,
                network: 'eip155:8453',
                asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                amount: '5000',
              },
            ],
          },
        ],
      };
    });

    const result = await probeX402Endpoint(templateUrl, 'GET');

    expect(result.success).toBe(true);
    expect(checkEndpointSchema).toHaveBeenCalled();
    expect(
      vi.mocked(checkEndpointSchema).mock.calls.map(([options]) => options.url)
    ).toEqual([concreteUrl]);
    expect(
      vi
        .mocked(checkEndpointSchema)
        .mock.calls.some(([options]) => options.url === templateUrl)
    ).toBe(false);
  });

  it('skips probing with an explicit diagnostic when no example exists', async () => {
    const missingExample: JsonObject = {
      openapi: '3.1.0',
      info: { title: 'Fixture', version: '1.0.0' },
      paths: {
        '/v1/entity/{entityId}/profile': {
          get: {
            parameters: [
              {
                name: 'entityId',
                in: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
          },
        },
      },
    };
    mockOpenApi(missingExample);

    const result = await probeX402Endpoint(templateUrl, 'GET');

    expect(result).toMatchObject({
      success: false,
      skipped: true,
      error: expect.stringContaining(
        'required path parameter "entityId" has no valid scalar example'
      ),
    });
    expect(checkEndpointSchema).not.toHaveBeenCalled();
  });
});

function mockOpenApi(raw: JsonObject) {
  vi.mocked(getOpenAPI).mockResolvedValue({
    isErr: () => false,
    isOk: () => true,
    value: {
      raw,
      info: { title: 'Fixture', version: '1.0.0' },
      routes: [],
      fetchedUrl: 'https://api.example.test/openapi.json',
    },
  } as never);
}
