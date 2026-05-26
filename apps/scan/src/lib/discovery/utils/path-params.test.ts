import { describe, it, expect } from 'vitest';
import { hasPathParameters } from './path-params';

describe('hasPathParameters', () => {
  it('detects raw braces in URL path', () => {
    expect(
      hasPathParameters(
        'https://store.nosub.club/v1/files/public/{blobId}/extend'
      )
    ).toBe(true);
  });

  it('detects URL-encoded braces', () => {
    expect(
      hasPathParameters(
        'https://store.nosub.club/v1/files/public/%7BblobId%7D/extend'
      )
    ).toBe(true);
  });

  it('detects case-insensitive encoded braces', () => {
    expect(
      hasPathParameters('https://store.nosub.club/v1/files/%7bblobId%7d/extend')
    ).toBe(true);
  });

  it('returns false for regular URLs', () => {
    expect(hasPathParameters('https://store.nosub.club/v1/files/public')).toBe(
      false
    );
  });

  it('returns false for URLs with braces in query params only', () => {
    expect(hasPathParameters('https://example.com/api?filter={name}')).toBe(
      false
    );
  });

  it('handles multiple path parameters', () => {
    expect(
      hasPathParameters('https://api.example.com/{org}/{repo}/issues')
    ).toBe(true);
  });

  it('handles bare paths without protocol', () => {
    expect(hasPathParameters('/v1/files/{id}')).toBe(true);
  });
});
