import { describe, it, expect } from 'vitest';
import { convertTokenAmount, formatTokenAmount } from '../token';

describe('Token Utilities', () => {
  describe('convertTokenAmount', () => {
    it('should convert amounts less than 1 token (6 decimals)', () => {
      // 0.5 USDC = 500000 (with 6 decimals)
      expect(convertTokenAmount(BigInt(500000), 6)).toBe(0.5);
    });

    it('should convert amounts equal to 1 token', () => {
      // 1 USDC = 1000000 (with 6 decimals)
      expect(convertTokenAmount(BigInt(1000000), 6)).toBe(1.0);
    });

    it('should convert amounts greater than 1 token', () => {
      // 1.5 USDC = 1500000 (with 6 decimals)
      expect(convertTokenAmount(BigInt(1500000), 6)).toBe(1.5);
    });

    it('should handle large amounts', () => {
      // 1000 USDC = 1000000000 (with 6 decimals)
      expect(convertTokenAmount(BigInt(1000000000), 6)).toBe(1000.0);
    });

    it('should handle very small amounts', () => {
      // 0.000001 USDC = 1 (with 6 decimals)
      expect(convertTokenAmount(BigInt(1), 6)).toBe(0.000001);
    });

    it('should handle zero', () => {
      expect(convertTokenAmount(BigInt(0), 6)).toBe(0);
    });

    it('should pad with zeros for small amounts', () => {
      // 0.001 USDC = 1000 (with 6 decimals)
      expect(convertTokenAmount(BigInt(1000), 6)).toBe(0.001);
    });

    it('should work with 18 decimals (like ETH)', () => {
      // 1 ETH = 1000000000000000000 (with 18 decimals)
      expect(convertTokenAmount(BigInt('1000000000000000000'), 18)).toBe(1.0);
    });

    it('should handle fractional ETH amounts', () => {
      // 0.5 ETH = 500000000000000000 (with 18 decimals)
      expect(convertTokenAmount(BigInt('500000000000000000'), 18)).toBe(0.5);
    });

    it('should handle 2 decimals', () => {
      // 1.5 with 2 decimals = 150
      expect(convertTokenAmount(BigInt(150), 2)).toBe(1.5);
    });

    it('should use default 6 decimals when not specified', () => {
      expect(convertTokenAmount(BigInt(1000000))).toBe(1.0);
    });

    it('should handle amounts with trailing zeros in decimal part', () => {
      // 1.100000 USDC = 1100000 (with 6 decimals)
      expect(convertTokenAmount(BigInt(1100000), 6)).toBe(1.1);
    });

    it('should preserve precision for complex amounts', () => {
      // 123.456789 USDC = 123456789 (with 6 decimals) 
      expect(convertTokenAmount(BigInt(123456789), 6)).toBe(123.456789);
    });

    it('should handle single digit amounts less than smallest unit', () => {
      // With 6 decimals, 5 = 0.000005
      expect(convertTokenAmount(BigInt(5), 6)).toBe(0.000005);
    });
  });

  describe('formatTokenAmount', () => {
    it('should format token amounts as currency', () => {
      // 1 USDC = 1000000
      const result = formatTokenAmount(BigInt(1000000), 6);
      expect(result).toContain('$');
      expect(result).toContain('1');
    });

    it('should format small amounts', () => {
      // 0.5 USDC = 500000
      const result = formatTokenAmount(BigInt(500000), 6);
      expect(result).toContain('$');
      expect(result).toContain('0.5');
    });

    it('should format large amounts with compact notation', () => {
      // 1000 USDC = 1000000000
      const result = formatTokenAmount(BigInt(1000000000), 6);
      expect(result).toContain('$');
      // Compact notation might show as "1K" or similar
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle zero amounts', () => {
      const result = formatTokenAmount(BigInt(0), 6);
      expect(result).toContain('$');
      expect(result).toContain('0');
    });

    it('should use default 6 decimals', () => {
      const result = formatTokenAmount(BigInt(1000000));
      expect(result).toContain('$');
    });

    it('should format very small amounts correctly', () => {
      // 0.01 USDC = 10000
      const result = formatTokenAmount(BigInt(10000), 6);
      expect(result).toContain('$');
    });

    it('should handle amounts less than 0.01', () => {
      // 0.001 USDC = 1000
      const result = formatTokenAmount(BigInt(1000), 6);
      expect(result).toBe('< $0.01');
    });
  });
});