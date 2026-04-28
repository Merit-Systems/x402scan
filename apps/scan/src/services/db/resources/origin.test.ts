import { describe, expect, it, vi } from 'vitest';

vi.mock('@x402scan/scan-db', () => ({
  scanDb: {},
}));

import { dedupeOgImagesByUrl } from './origin';

describe('dedupeOgImagesByUrl', () => {
  it('keeps one write per URL so OgImage upserts cannot race each other', () => {
    const ogImages = dedupeOgImagesByUrl([
      {
        url: 'https://example.com/og.png',
        width: 1200,
        title: 'first',
      },
      {
        url: 'https://example.com/og.png',
        width: 1600,
        title: 'last',
      },
      {
        url: 'https://example.com/other.png',
        height: 630,
      },
    ]);

    expect(ogImages).toEqual([
      {
        url: 'https://example.com/og.png',
        width: 1600,
        title: 'last',
      },
      {
        url: 'https://example.com/other.png',
        height: 630,
      },
    ]);
  });
});
