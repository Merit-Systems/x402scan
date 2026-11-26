import { describe, it, expect, vi, afterEach } from 'vitest';
import { describeOpenApiFailure } from './openapi-blocked';

const ORIGIN = 'https://api.example.com';

describe('describeOpenApiFailure', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(impl: typeof fetch) {
    const spy = vi.fn(impl);
    vi.stubGlobal('fetch', spy);
    return spy;
  }

  it('explains a Cloudflare bot challenge', async () => {
    const spy = stubFetch(() =>
      Promise.resolve(
        new Response('<!DOCTYPE html><title>Just a moment...</title>', {
          status: 403,
          headers: { 'cf-mitigated': 'challenge', 'content-type': 'text/html' },
        })
      )
    );
    const message = await describeOpenApiFailure(ORIGIN, {
      'Cache-Control': 'no-cache',
    });
    expect(message).toContain('Cloudflare');
    expect(message).toContain('HTTP 403');
    expect(message).toContain(`${ORIGIN}/openapi.json`);
    expect(spy).toHaveBeenCalledWith(
      `${ORIGIN}/openapi.json`,
      expect.objectContaining({
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      })
    );
  });

  it('reports a non-2xx status', async () => {
    stubFetch(() => Promise.resolve(new Response('missing', { status: 404 })));
    expect(await describeOpenApiFailure(ORIGIN)).toBe(
      `No discovery document found: ${ORIGIN}/openapi.json returned HTTP 404.`
    );
  });

  it('reports a body that is not JSON', async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response('<html></html>', {
          headers: { 'content-type': 'text/html' },
        })
      )
    );
    expect(await describeOpenApiFailure(ORIGIN)).toBe(
      `No discovery document found: ${ORIGIN}/openapi.json returned text/html, not JSON.`
    );
  });

  it('returns null when the origin serves JSON', async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response('{"openapi":"3.1.0"}', {
          headers: { 'content-type': 'application/json' },
        })
      )
    );
    expect(await describeOpenApiFailure(ORIGIN)).toBeNull();
  });

  it('returns null when the probe errors', async () => {
    stubFetch(() => Promise.reject(new Error('network down')));
    expect(await describeOpenApiFailure(ORIGIN)).toBeNull();
  });
});
