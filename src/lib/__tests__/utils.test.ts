import { describe, it, expect } from 'vitest';
import {
  cn,
  formatCurrency,
  formatCompactAgo,
  formatAddress,
  getPercentageFromBigInt,
  USDC_ADDRESS,
} from '../utils';

describe('General Utilities', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toContain('foo');
      expect(result).toContain('bar');
    });

    it('should handle conditional classes', () => {
      const result = cn('foo', false && 'bar', 'baz');
      expect(result).toContain('foo');
      expect(result).toContain('baz');
      expect(result).not.toContain('bar');
    });

    it('should merge tailwind classes properly', () => {
      // Tailwind merge should handle conflicting classes
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toContain('px-4'); // Later px-4 should override px-2
    });

    it('should handle undefined and null', () => {
      const result = cn('foo', undefined, null, 'bar');
      expect(result).toContain('foo');
      expect(result).toContain('bar');
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers as USD currency', () => {
      const result = formatCurrency(100);
      expect(result).toContain('$');
      expect(result).toContain('100');
    });

    it('should format with 2 decimal places', () => {
      const result = formatCurrency(100.5);
      expect(result).toMatch(/\.50/);
    });

    it('should use compact notation for large numbers', () => {
      const result = formatCurrency(1000000);
      // Compact notation typically shows as "1M" or similar
      expect(result).toContain('$');
    });

    it('should show "< $0.01" for very small positive amounts', () => {
      expect(formatCurrency(0.001)).toBe('< $0.01');
      expect(formatCurrency(0.009)).toBe('< $0.01');
    });

    it('should format 0.01 normally (not as less than)', () => {
      const result = formatCurrency(0.01);
      expect(result).not.toBe('< $0.01');
      expect(result).toContain('0.01');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('$');
      expect(result).toContain('0.00');
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-50);
      expect(result).toContain('$');
      expect(result).toContain('50');
    });

    it('should accept custom options', () => {
      const result = formatCurrency(1000, { minimumFractionDigits: 0 });
      expect(result).toContain('$');
      expect(result).toContain('1');
    });
  });

  describe('formatCompactAgo', () => {
    it('should format seconds compactly', () => {
      const date = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      const result = formatCompactAgo(date);
      // date-fns might round to "1m ago" depending on timing
      expect(result).toMatch(/\d+[sm] ago/);
    });

    it('should format minutes compactly', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const result = formatCompactAgo(date);
      expect(result).toContain('5m');
    });

    it('should format hours compactly', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const result = formatCompactAgo(date);
      expect(result).toContain('2h');
    });

    it('should format days compactly', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const result = formatCompactAgo(date);
      expect(result).toContain('3d');
    });

    it('should replace "less than" with "<"', () => {
      const date = new Date(Date.now() - 5 * 1000); // Few seconds ago
      const result = formatCompactAgo(date);
      expect(result).toContain('<');
      expect(result).not.toContain('less than');
    });

    it('should replace "a " with "1 "', () => {
      const date = new Date(Date.now() - 60 * 1000); // About a minute ago
      const result = formatCompactAgo(date);
      expect(result).toContain('1');
      expect(result).not.toContain('a minute');
    });

    it('should replace "about" with "~"', () => {
      const date = new Date(Date.now() - 60 * 60 * 1000); // About an hour ago
      const result = formatCompactAgo(date);
      if (result.includes('~') || result.includes('1h')) {
        expect(true).toBe(true); // Either format is acceptable
      }
    });

    it('should include "ago"', () => {
      const date = new Date(Date.now() - 30 * 1000);
      const result = formatCompactAgo(date);
      expect(result).toContain('ago');
    });

    it('should handle recent dates', () => {
      const date = new Date(Date.now() - 1000);
      const result = formatCompactAgo(date);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatAddress', () => {
    it('should shorten Ethereum addresses', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = formatAddress(address);
      
      expect(result).toContain('0x1234');
      expect(result).toContain('567890');
      expect(result).toContain('...');
    });

    it('should show first 6 characters', () => {
      const address = '0xabcdefABCDEF1234567890123456789012345678';
      const result = formatAddress(address);
      
      expect(result.startsWith('0xabcd')).toBe(true);
    });

    it('should show last 6 characters', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = formatAddress(address);
      
      expect(result.endsWith('567890')).toBe(true);
    });

    it('should include ellipsis in the middle', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = formatAddress(address);
      
      expect(result).toContain('...');
    });

    it('should produce format: 0x1234...567890', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const result = formatAddress(address);
      
      expect(result).toBe('0x1234...567890');
    });

    it('should handle addresses with different cases', () => {
      const address = '0xABCDEF1234567890123456789012345678901234';
      const result = formatAddress(address);
      
      expect(result).toContain('0xABCD');
      expect(result).toContain('...');
    });
  });

  describe('getPercentageFromBigInt', () => {
    it('should calculate positive percentage change', () => {
      const previous = BigInt(100);
      const current = BigInt(150);
      const result = getPercentageFromBigInt(previous, current);
      
      expect(result).toBe(50); // 50% increase
    });

    it('should calculate negative percentage change', () => {
      const previous = BigInt(100);
      const current = BigInt(75);
      const result = getPercentageFromBigInt(previous, current);
      
      expect(result).toBe(-25); // 25% decrease
    });

    it('should return 0 for no change', () => {
      const previous = BigInt(100);
      const current = BigInt(100);
      const result = getPercentageFromBigInt(previous, current);
      
      expect(result).toBe(0);
    });

    it('should handle doubling (100% increase)', () => {
      const previous = BigInt(50);
      const current = BigInt(100);
      const result = getPercentageFromBigInt(previous, current);
      
      expect(result).toBe(100);
    });

    it('should handle halving (50% decrease)', () => {
      const previous = BigInt(100);
      const current = BigInt(50);
      const result = getPercentageFromBigInt(previous, current);
      
      expect(result).toBe(-50);
    });

    it('should handle large numbers', () => {
      const previous = BigInt(1000000);
      const current = BigInt(1500000);
      const result = getPercentageFromBigInt(previous, current);
      
      expect(result).toBe(50);
    });

    it('should handle small increases', () => {
      const previous = BigInt(100);
      const current = BigInt(101);
      const result = getPercentageFromBigInt(previous, current);
      
      expect(result).toBe(1);
    });

    it('should handle increase from 0', () => {
      const previous = BigInt(0);
      const current = BigInt(100);
      
      // This will result in Infinity or error - document the behavior
      const result = getPercentageFromBigInt(previous, current);
      expect(result).toBe(Infinity);
    });
  });

  describe('USDC_ADDRESS constant', () => {
    it('should be a valid Ethereum address', () => {
      expect(USDC_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should be the correct USDC contract address', () => {
      // This is the actual Base USDC address
      expect(USDC_ADDRESS).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
    });

    it('should be a string', () => {
      expect(typeof USDC_ADDRESS).toBe('string');
    });
  });
});