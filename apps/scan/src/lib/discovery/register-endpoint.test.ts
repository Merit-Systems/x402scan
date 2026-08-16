import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registerResource } from '@/lib/resources';
import { probeX402Endpoint } from './probe';
import { registerEndpoint } from './register-endpoint';

vi.mock('./probe', () => ({
  probeX402Endpoint: vi.fn(),
}));

vi.mock('@/lib/resources', () => ({
  registerResource: vi.fn(),
}));

vi.mock('./discover-siblings', () => ({
  discoverSiblingResources: vi.fn(() =>
    Promise.resolve({ found: false, resources: [] })
  ),
}));

vi.mock('@/lib/url-helpers', () => ({
  isTunnelUrl: vi.fn(() => false),
}));

describe('registerEndpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['GET', 'POST'] as const)(
    'persists the probed %s method',
    async method => {
      const url = 'https://api.example.com/check?capability=fact-check';
      const advisory = { method, source: 'probe' as const, paymentOptions: [] };
      vi.mocked(probeX402Endpoint).mockResolvedValue({
        success: true,
        advisory,
        warnings: [],
      });
      vi.mocked(registerResource).mockResolvedValue({
        success: true,
        resource: { id: 'resource-1', origin: { id: 'origin-1' } },
        accepts: [],
        response: {},
        warnings: [],
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
      });

      await registerEndpoint(url);

      expect(registerResource).toHaveBeenCalledWith(
        url,
        advisory,
        expect.objectContaining({ method })
      );
    }
  );
});
