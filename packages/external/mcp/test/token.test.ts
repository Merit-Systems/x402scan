import { describe, it, expect } from 'vitest';
import { tokenStringToNumber } from '../src/shared/token';

describe('tokenStringToNumber', () => {
  it('converts atomic base unit string to number (6 decimals USDC)', () => {
    expect(tokenStringToNumber('50000', 6)).toBe(0.05);
    expect(tokenStringToNumber('1000000', 6)).toBe(1);
    expect(tokenStringToNumber('1500000', 6)).toBe(1.5);
  });

  it('handles already-formatted decimal strings without throwing SyntaxError', () => {
    expect(tokenStringToNumber('0.05', 6)).toBe(0.05);
    expect(tokenStringToNumber('1.5', 6)).toBe(1.5);
  });

  it('handles empty or invalid strings gracefully', () => {
    expect(tokenStringToNumber('')).toBe(0);
    expect(tokenStringToNumber('invalid')).toBe(0);
  });
});
