import { afterEach, describe, expect, it, vi } from 'vitest';

import { detectBlockedFavicon } from './favicon-blocked';

function mockHead(headers: Record<string, string>, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, headers: new Headers(headers) })
  );
}

const URL_UNDER_TEST = 'https://api.example.com/favicon.ico';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('detectBlockedFavicon', () => {
  it('reports a same-origin policy', async () => {
    mockHead({ 'cross-origin-resource-policy': 'same-origin' });

    await expect(detectBlockedFavicon(URL_UNDER_TEST)).resolves.toEqual({
      url: URL_UNDER_TEST,
      policy: 'same-origin',
    });
  });

  it('reports a same-site policy', async () => {
    mockHead({ 'cross-origin-resource-policy': 'same-site' });

    await expect(detectBlockedFavicon(URL_UNDER_TEST)).resolves.toEqual({
      url: URL_UNDER_TEST,
      policy: 'same-site',
    });
  });

  it('normalizes casing and whitespace', async () => {
    mockHead({ 'cross-origin-resource-policy': '  Same-Origin  ' });

    await expect(detectBlockedFavicon(URL_UNDER_TEST)).resolves.toEqual({
      url: URL_UNDER_TEST,
      policy: 'same-origin',
    });
  });

  it('returns null for an explicit cross-origin policy', async () => {
    mockHead({ 'cross-origin-resource-policy': 'cross-origin' });

    await expect(detectBlockedFavicon(URL_UNDER_TEST)).resolves.toBeNull();
  });

  it('returns null when no policy header is sent', async () => {
    mockHead({});

    await expect(detectBlockedFavicon(URL_UNDER_TEST)).resolves.toBeNull();
  });

  it('returns null when the favicon is unreachable', async () => {
    mockHead({ 'cross-origin-resource-policy': 'same-origin' }, false);

    await expect(detectBlockedFavicon(URL_UNDER_TEST)).resolves.toBeNull();
  });

  it('returns null when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));

    await expect(detectBlockedFavicon(URL_UNDER_TEST)).resolves.toBeNull();
  });
});
