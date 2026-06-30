import { describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({
  env: {
    CLAIM_SECRET: 'test-secret',
    NEXT_PUBLIC_NODE_ENV: 'development',
  },
}));

const {
  generateClaimCode,
  generateOpaqueToken,
  hashClaimValue,
  safeHashEqual,
  normalizeEmail,
  maskEmail,
} = await import('./crypto');

describe('generateClaimCode', () => {
  it('always returns a 6-digit numeric string, including leading zeros', () => {
    for (let i = 0; i < 2000; i++) {
      const code = generateClaimCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });
});

describe('generateOpaqueToken', () => {
  it('returns a url-safe token and is unique across calls', () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a).not.toEqual(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe('hashClaimValue / safeHashEqual', () => {
  it('is deterministic for the same input', () => {
    expect(hashClaimValue('123456')).toEqual(hashClaimValue('123456'));
  });

  it('differs for different inputs and compares safely', () => {
    expect(hashClaimValue('123456')).not.toEqual(hashClaimValue('123457'));
    expect(safeHashEqual(hashClaimValue('abc'), hashClaimValue('abc'))).toBe(
      true
    );
    expect(safeHashEqual(hashClaimValue('abc'), hashClaimValue('xyz'))).toBe(
      false
    );
  });

  it('never throws on malformed hex and returns false', () => {
    expect(safeHashEqual('zz', hashClaimValue('abc'))).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Lucas@Example.COM ')).toBe('lucas@example.com');
  });
});

describe('maskEmail', () => {
  it('masks the local part but keeps the domain', () => {
    expect(maskEmail('lucas@example.com')).toBe('l••••@example.com');
  });

  it('handles single-character local parts without exposing it as empty', () => {
    expect(maskEmail('a@example.com')).toBe('a•@example.com');
  });

  it('returns the input unchanged when there is no @', () => {
    expect(maskEmail('notanemail')).toBe('notanemail');
  });
});
