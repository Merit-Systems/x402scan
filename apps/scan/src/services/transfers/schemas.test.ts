import { describe, expect, it } from 'vitest';

import { cdpSqlIntegerSchema, cdpSqlNumberSchema } from './schemas';

describe('cdpSqlNumberSchema', () => {
  it('keeps numbers as numbers', () => {
    expect(cdpSqlNumberSchema.parse(123.45)).toBe(123.45);
  });

  it('converts numeric strings from raw SQL drivers', () => {
    expect(cdpSqlNumberSchema.parse('123.45')).toBe(123.45);
    expect(cdpSqlNumberSchema.parse(' 0 ')).toBe(0);
  });

  it('converts BigInt values before cached results are serialized', () => {
    const value = cdpSqlNumberSchema.parse(BigInt(42));

    expect(value).toBe(42);
    expect(JSON.stringify({ value })).toBe('{"value":42}');
  });

  it('rejects non-finite and non-numeric values', () => {
    expect(cdpSqlNumberSchema.safeParse('').success).toBe(false);
    expect(cdpSqlNumberSchema.safeParse('not-a-number').success).toBe(false);
    expect(cdpSqlNumberSchema.safeParse(Number.POSITIVE_INFINITY).success).toBe(
      false
    );
  });
});

describe('cdpSqlIntegerSchema', () => {
  it('accepts integer strings and BigInts', () => {
    expect(cdpSqlIntegerSchema.parse('123')).toBe(123);
    expect(cdpSqlIntegerSchema.parse(BigInt(123))).toBe(123);
  });

  it('rejects fractional values', () => {
    expect(cdpSqlIntegerSchema.safeParse('1.25').success).toBe(false);
    expect(cdpSqlIntegerSchema.safeParse(1.25).success).toBe(false);
  });
});
