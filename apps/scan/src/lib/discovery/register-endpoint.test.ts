import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerEndpoint } from './register-endpoint';
import { probeX402Endpoint } from './probe';
import { registerResource } from '@/lib/resources';
import { discoverSiblingResources } from './discover-siblings';

vi.mock('./probe', () => ({ probeX402Endpoint: vi.fn() }));
vi.mock('@/lib/resources', () => ({ registerResource: vi.fn() }));
vi.mock('./discover-siblings', () => ({
  discoverSiblingResources: vi.fn(() => Promise.resolve({ found: false })),
}));
vi.mock('@/lib/url-helpers', () => ({ isTunnelUrl: () => false }));

describe('registerEndpoint registry metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuses registryEligible=false before any probe', async () => {
    const result = await registerEndpoint('https://merchant.test/v1/control', {
      registryEligible: false,
    });
    expect(result.success).toBe(false);
    if (result.success) throw new Error('EXPECTED_REGISTRY_EXCLUSION');
    expect(result.error?.type).toBe('registryExcluded');
    expect(probeX402Endpoint).not.toHaveBeenCalled();
    expect(registerResource).not.toHaveBeenCalled();
  });

  it('passes the selected operation method with its trusted query metadata', async () => {
    vi.mocked(probeX402Endpoint).mockResolvedValue({
      success: true,
      advisory: { method: 'POST' } as never,
      warnings: [],
    });
    vi.mocked(registerResource).mockResolvedValue({
      success: true,
      resource: { origin: { id: 'origin-1' } },
      warnings: [],
    } as never);

    const schema = { anyOf: [{ required: ['symbols'] }] };
    await registerEndpoint('https://merchant.test/v1/paid', {
      queryParametersSchema: schema,
      method: 'POST',
    });

    expect(probeX402Endpoint).toHaveBeenCalledWith(
      'https://merchant.test/v1/paid',
      'POST',
      undefined,
      schema
    );
    expect(discoverSiblingResources).toHaveBeenCalled();
  });
});
