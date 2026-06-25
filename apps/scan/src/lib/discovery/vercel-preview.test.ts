import { describe, it, expect, vi, afterEach } from 'vitest';
import { isVercelHost, isVercelPreviewDeployment } from './vercel-preview';

describe('isVercelHost', () => {
  it('detects *.vercel.app subdomains', () => {
    expect(isVercelHost('https://nemu-gamma.vercel.app/api/price')).toBe(true);
    expect(
      isVercelHost('https://agentcash-egwf1g5ii-merit-systems.vercel.app/')
    ).toBe(true);
  });

  it('allows custom domains', () => {
    expect(isVercelHost('https://stableenrich.dev/api')).toBe(false);
    expect(isVercelHost('https://api.example.com')).toBe(false);
  });

  it('does not false-positive on lookalike hosts', () => {
    // hostname is `myvercel.app` — ends with `vercel.app` but not `.vercel.app`
    expect(isVercelHost('https://myvercel.app')).toBe(false);
    // `vercel.app.evil.com` is a different registrable domain
    expect(isVercelHost('https://vercel.app.evil.com')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isVercelHost('not-a-url')).toBe(false);
    expect(isVercelHost('')).toBe(false);
  });
});

describe('isVercelPreviewDeployment', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(impl: typeof fetch) {
    const spy = vi.fn(impl);
    vi.stubGlobal('fetch', spy);
    return spy;
  }

  it('returns true for a *.vercel.app deployment serving x-robots-tag: noindex', async () => {
    const spy = stubFetch(() =>
      Promise.resolve(
        new Response(null, { headers: { 'x-robots-tag': 'noindex' } })
      )
    );
    expect(
      await isVercelPreviewDeployment('https://preview-abc123.vercel.app/api/x')
    ).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('returns true when noindex is one of several directives', async () => {
    stubFetch(() =>
      Promise.resolve(
        new Response(null, { headers: { 'x-robots-tag': 'noindex, nofollow' } })
      )
    );
    expect(
      await isVercelPreviewDeployment('https://preview-abc123.vercel.app/')
    ).toBe(true);
  });

  it('returns false for a production *.vercel.app alias without the header', async () => {
    stubFetch(() => Promise.resolve(new Response(null, { headers: {} })));
    expect(
      await isVercelPreviewDeployment('https://agent402.vercel.app/api/x')
    ).toBe(false);
  });

  it('short-circuits non-vercel hosts without any network call', async () => {
    const spy = stubFetch(() => Promise.resolve(new Response(null)));
    expect(
      await isVercelPreviewDeployment('https://stableenrich.dev/api')
    ).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('fails open (returns false) when the probe errors', async () => {
    stubFetch(() => Promise.reject(new Error('network down')));
    expect(
      await isVercelPreviewDeployment('https://preview-abc123.vercel.app/')
    ).toBe(false);
  });
});
