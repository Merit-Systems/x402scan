import { describe, it, expect } from 'vitest';

import { aggregateCount, aggregateString } from './numeric';

describe('aggregateCount', () => {
  it('accepts a bigint and returns a number', () => {
    const result = aggregateCount.parse(BigInt(42));
    expect(result).toBe(42);
    expect(typeof result).toBe('number');
  });

  it('passes through a number unchanged', () => {
    expect(aggregateCount.parse(17)).toBe(17);
  });

  it('accepts a numeric string and coerces it', () => {
    expect(aggregateCount.parse('100')).toBe(100);
  });

  it('accepts zero', () => {
    expect(aggregateCount.parse(BigInt(0))).toBe(0);
    expect(aggregateCount.parse(0)).toBe(0);
    expect(aggregateCount.parse('0')).toBe(0);
  });

  it('accepts negative values', () => {
    expect(aggregateCount.parse(BigInt(-5))).toBe(-5);
    expect(aggregateCount.parse('-5')).toBe(-5);
  });

  it('rejects bigints larger than Number.MAX_SAFE_INTEGER', () => {
    const unsafe = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
    const result = aggregateCount.safeParse(unsafe);
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric strings', () => {
    expect(aggregateCount.safeParse('not a number').success).toBe(false);
    expect(aggregateCount.safeParse('').success).toBe(false);
  });

  it('rejects Infinity and NaN', () => {
    expect(aggregateCount.safeParse(Infinity).success).toBe(false);
    expect(aggregateCount.safeParse(NaN).success).toBe(false);
  });

  it('is JSON-serialisable (the whole point of this schema)', () => {
    const round = JSON.parse(
      JSON.stringify({ value: aggregateCount.parse(BigInt(123)) })
    ) as { value: number };
    expect(round.value).toBe(123);
  });
});

describe('aggregateString', () => {
  it('stringifies a bigint', () => {
    expect(aggregateString.parse(BigInt(42))).toBe('42');
  });

  it('stringifies an oversized bigint losslessly', () => {
    const unsafe = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
    expect(aggregateString.parse(unsafe)).toBe(unsafe.toString());
  });

  it('stringifies a number', () => {
    expect(aggregateString.parse(17)).toBe('17');
  });

  it('passes numeric strings through', () => {
    expect(aggregateString.parse('100')).toBe('100');
  });

  it('rejects non-numeric strings', () => {
    expect(aggregateString.safeParse('abc').success).toBe(false);
  });

  it('is JSON-serialisable', () => {
    const round = JSON.parse(
      JSON.stringify({ value: aggregateString.parse(BigInt(999)) })
    ) as { value: string };
    expect(round.value).toBe('999');
  });
});
