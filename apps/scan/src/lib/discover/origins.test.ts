import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/env', () => ({
  env: {
    AGENTCASH_URL: 'https://agentcash.dev',
    AGENTCASH_INTERNAL_API_KEY: 'test-internal-key',
  },
}));

vi.mock('@/lib/cache', () => ({
  CACHE_TTL_SECONDS: 60,
}));

vi.mock('@/lib/redis', () => ({
  getRedisClient: () => null,
}));

import { fetchUsedOriginsFromAgentCash } from './origins';

const originalFetch = global.fetch;

describe('fetchUsedOriginsFromAgentCash', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns origins from a successful response and calls the right URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          protocol: 'x402',
          count: 3,
          origins: [
            'https://a.example.com',
            'https://b.example.com',
            'https://c.example.com',
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await fetchUsedOriginsFromAgentCash('x402');

    expect(result).toEqual([
      'https://a.example.com',
      'https://b.example.com',
      'https://c.example.com',
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(calledUrl.pathname).toBe('/api/internal/catalog/used-origins');
    expect(calledUrl.searchParams.get('protocol')).toBe('x402');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer test-internal-key',
    });
  });

  it('returns null when the endpoint returns non-200', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response('upstream down', { status: 503 })
      ) as unknown as typeof fetch;

    const result = await fetchUsedOriginsFromAgentCash('x402');

    expect(result).toBeNull();
  });

  it('returns null when fetch throws (network failure)', async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error('boom')) as unknown as typeof fetch;

    const result = await fetchUsedOriginsFromAgentCash('x402');

    expect(result).toBeNull();
  });

  it('returns null when response is not valid JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('<html>not json</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      })
    ) as unknown as typeof fetch;

    const result = await fetchUsedOriginsFromAgentCash('x402');

    expect(result).toBeNull();
  });

  it('returns null when payload is missing the origins array', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ protocol: 'x402', count: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    ) as unknown as typeof fetch;

    const result = await fetchUsedOriginsFromAgentCash('x402');

    expect(result).toBeNull();
  });

  it('returns null when origins contains non-string values', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          protocol: 'x402',
          count: 2,
          origins: ['https://ok.example.com', 42],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    ) as unknown as typeof fetch;

    const result = await fetchUsedOriginsFromAgentCash('x402');

    expect(result).toBeNull();
  });
});
