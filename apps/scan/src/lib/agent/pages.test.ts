import { describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({
  env: { NEXT_PUBLIC_APP_URL: 'https://www.x402scan.com' },
}));

import {
  getMarkdownPage,
  MARKDOWN_PAGES,
  normalizePath,
  notFoundMarkdown,
  WHEN_TO_USE,
} from './pages';

describe('markdown pages', () => {
  it('normalises trailing slashes', () => {
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('/docs/')).toBe('/docs');
    expect(normalizePath('')).toBe('/');
  });

  it('resolves pages by path', () => {
    expect(getMarkdownPage('/docs')?.title).toBe('API documentation');
    expect(getMarkdownPage('/docs/')?.title).toBe('API documentation');
    expect(getMarkdownPage('/nope')).toBeUndefined();
  });

  it('has unique paths and an H1 + blockquote summary on every page', async () => {
    const paths = MARKDOWN_PAGES.map(p => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const page of MARKDOWN_PAGES) {
      const body = await page.body();
      expect(body.trimStart().startsWith('# '), page.path).toBe(true);
      expect(body.length, page.path).toBeGreaterThan(300);
    }
  });

  it('trust and docs pages carry at least 500 characters of content', async () => {
    for (const path of ['/about', '/contact', '/pricing', '/docs']) {
      const body = await getMarkdownPage(path)!.body();
      expect(body.length, path).toBeGreaterThan(500);
    }
  });

  it('contact page lists real contact channels and the postal address', async () => {
    const body = await getMarkdownPage('/contact')!.body();
    expect(body).toContain('legal@merit.systems');
    expect(body).toContain('privacy@merit.systems');
    expect(body).toContain('224 West 35th Street');
  });

  it('docs cover auth, errors, rate limits, versioning, CLI and every endpoint', async () => {
    const body = await getMarkdownPage('/docs')!.body();
    for (const section of [
      '## Authentication and payment',
      '## Errors',
      '## Rate limits',
      '## Versioning and deprecation',
      '## MCP server and CLI',
      'X-API-Version',
      'RateLimit-Policy',
      'Retry-After',
    ]) {
      expect(body).toContain(section);
    }
    expect(body.match(/^### `(GET|POST) \/api\/x402/gm)).toHaveLength(15);
  });

  it('when-to-use guidance names concrete jobs and how to call the API', () => {
    expect(WHEN_TO_USE).toContain('## When to use x402scan');
    expect(WHEN_TO_USE).toContain('/api/x402/resources/search');
    expect(WHEN_TO_USE).toContain('openapi.json');
    expect(WHEN_TO_USE).toContain('X-Payment');
  });

  it('404 markdown points at sitemap, llms.txt and docs', () => {
    const body = notFoundMarkdown('/does/not/exist/');
    expect(body).toContain('# 404');
    expect(body).toContain('`/does/not/exist`');
    expect(body).toContain('/sitemap.xml');
    expect(body).toContain('/llms.txt');
    expect(body).toContain('/docs');
  });
});
