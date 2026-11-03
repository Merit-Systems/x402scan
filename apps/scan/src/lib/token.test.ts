import { describe, it, expect } from 'vitest';

import { convertTokenAmount } from './token';

describe('convertTokenAmount', () => {
  it('converts USDC atomic amounts (the 6-decimal default)', () => {
    expect(convertTokenAmount(0n)).toBe(0);
    expect(convertTokenAmount(1n)).toBe(0.000001);
    expect(convertTokenAmount(10_000n)).toBe(0.01);
    expect(convertTokenAmount(500_000n)).toBe(0.5);
    expect(convertTokenAmount(999_999n)).toBe(0.999999);
    expect(convertTokenAmount(1_000_000n)).toBe(1);
    expect(convertTokenAmount(1_500_000n)).toBe(1.5);
    expect(convertTokenAmount(123_456_789n)).toBe(123.456789);
  });

  it('treats the atomic amount as the display amount when decimals is 0', () => {
    // `tokenSchema.decimals` is `z.int().nonnegative()` and
    // `getSolanaTokenBalance` forwards the decimals the mint reports, so 0 is a
    // value this function is really called with. Before the fix every one of
    // these came back divided by 10 ** digits: 8n -> 0.8, 123456n -> 0.123456.
    expect(convertTokenAmount(0n, 0)).toBe(0);
    expect(convertTokenAmount(1n, 0)).toBe(1);
    expect(convertTokenAmount(8n, 0)).toBe(8);
    expect(convertTokenAmount(123_456n, 0)).toBe(123456);
  });

  it('converts assets that are not 6-decimal', () => {
    expect(convertTokenAmount(1_000_000_000n, 9)).toBe(1);
    expect(convertTokenAmount(1n, 9)).toBe(1e-9);
    expect(convertTokenAmount(10n ** 18n, 18)).toBe(1);
    expect(convertTokenAmount(10n ** 15n, 18)).toBe(0.001);
    expect(convertTokenAmount(1n, 18)).toBe(1e-18);
    expect(convertTokenAmount(150n, 2)).toBe(1.5);
    expect(convertTokenAmount(5n, 1)).toBe(0.5);
  });

  it('keeps precision at the boundary between the two branches', () => {
    // One digit fewer, exactly as many, and one more than `decimals`.
    expect(convertTokenAmount(99_999n, 6)).toBe(0.099999);
    expect(convertTokenAmount(999_999n, 6)).toBe(0.999999);
    expect(convertTokenAmount(9_999_999n, 6)).toBe(9.999999);
  });
});
