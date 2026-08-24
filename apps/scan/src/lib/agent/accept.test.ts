import { describe, expect, it } from 'vitest';

import { negotiateFormat } from './accept';

describe('negotiateFormat', () => {
  it('defaults to html when Accept is missing or empty', () => {
    expect(negotiateFormat(null)).toBe('html');
    expect(negotiateFormat(undefined)).toBe('html');
    expect(negotiateFormat('')).toBe('html');
    expect(negotiateFormat('   ')).toBe('html');
  });

  it('serves html for wildcard and browser-style Accept headers', () => {
    expect(negotiateFormat('*/*')).toBe('html');
    expect(
      negotiateFormat(
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8'
      )
    ).toBe('html');
    expect(negotiateFormat('text/*')).toBe('html');
  });

  it('serves markdown when it is requested explicitly', () => {
    expect(negotiateFormat('text/markdown')).toBe('markdown');
    expect(negotiateFormat('TEXT/MARKDOWN; charset=utf-8')).toBe('markdown');
    expect(negotiateFormat('text/markdown, */*;q=0.1')).toBe('markdown');
    expect(negotiateFormat('text/markdown;q=0.9, text/*;q=0.8')).toBe(
      'markdown'
    );
  });

  it('honours q-values between html and markdown', () => {
    expect(negotiateFormat('text/html;q=0.5, text/markdown;q=0.9')).toBe(
      'markdown'
    );
    expect(negotiateFormat('text/html;q=0.9, text/markdown;q=0.5')).toBe(
      'html'
    );
    expect(negotiateFormat('text/markdown;q=0, text/html')).toBe('html');
    expect(negotiateFormat('text/html;q=0, text/markdown')).toBe('markdown');
  });

  it('breaks q ties by specificity, then by order listed', () => {
    // exact markdown beats wildcard html at equal q
    expect(negotiateFormat('text/markdown, text/*')).toBe('markdown');
    expect(negotiateFormat('text/html, */*')).toBe('html');
    // both exact at equal q: first listed wins
    expect(negotiateFormat('text/markdown, text/html')).toBe('markdown');
    expect(negotiateFormat('text/html, text/markdown')).toBe('html');
  });

  it('returns not-acceptable only when neither representation matches', () => {
    expect(negotiateFormat('application/json')).toBe('not-acceptable');
    expect(negotiateFormat('image/png, application/xml')).toBe(
      'not-acceptable'
    );
    expect(negotiateFormat('text/html;q=0, text/markdown;q=0')).toBe(
      'not-acceptable'
    );
    expect(negotiateFormat('application/json, */*;q=0.1')).toBe('html');
  });

  it('tolerates malformed entries', () => {
    expect(negotiateFormat('text/markdown;q=abc')).toBe('not-acceptable');
    expect(negotiateFormat(',,text/markdown')).toBe('markdown');
    expect(negotiateFormat('garbage')).toBe('not-acceptable');
  });
});
