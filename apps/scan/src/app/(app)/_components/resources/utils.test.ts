import { describe, it, expect } from 'vitest';
import { parseMinFromPriceString, formatPricingLabel } from './utils';

describe('parseMinFromPriceString', () => {
  it('parses integer min from range', () => {
    expect(parseMinFromPriceString('50-300.00 USD')).toBe(50);
  });

  it('parses decimal min from range', () => {
    expect(parseMinFromPriceString('0.01-5.00 USD')).toBe(0.01);
  });

  it('returns 0 when min is 0', () => {
    expect(parseMinFromPriceString('0-300.00 USD')).toBe(0);
  });

  it('returns 0 for fixed price (no dash after number)', () => {
    expect(parseMinFromPriceString('300.00 USD')).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(parseMinFromPriceString('')).toBe(0);
  });

  it('returns 0 for garbage input', () => {
    expect(parseMinFromPriceString('not a price')).toBe(0);
  });

  it('returns 0 when string starts with dash', () => {
    expect(parseMinFromPriceString('-5.00 USD')).toBe(0);
  });

  it('handles no currency suffix', () => {
    expect(parseMinFromPriceString('10-100')).toBe(10);
  });

  it('handles whitespace around dash', () => {
    expect(parseMinFromPriceString('50 -300.00 USD')).toBe(50);
  });
});

describe('formatPricingLabel', () => {
  it('shows exact price for non-dynamic', () => {
    expect(formatPricingLabel({ maxAmount: 300, isDynamic: false })).toBe(
      '$300.00'
    );
  });

  it('shows "Up to" for dynamic without price', () => {
    expect(formatPricingLabel({ maxAmount: 300, isDynamic: true })).toBe(
      'Up to $300.00'
    );
  });

  it('shows "Up to" for dynamic with zero min', () => {
    expect(
      formatPricingLabel({
        maxAmount: 300,
        isDynamic: true,
        price: '0-300.00 USD',
      })
    ).toBe('Up to $300.00');
  });

  it('shows range for dynamic with nonzero min', () => {
    expect(
      formatPricingLabel({
        maxAmount: 300,
        isDynamic: true,
        price: '50-300.00 USD',
      })
    ).toBe('$50.00–$300.00');
  });

  it('shows range with small decimals', () => {
    expect(
      formatPricingLabel({
        maxAmount: 5,
        isDynamic: true,
        price: '0.01-5.00 USD',
      })
    ).toBe('$0.01–$5.00');
  });

  it('shows "Up to" for dynamic with unparseable price', () => {
    expect(
      formatPricingLabel({
        maxAmount: 300,
        isDynamic: true,
        price: 'garbage',
      })
    ).toBe('Up to $300.00');
  });

  it('ignores price when not dynamic', () => {
    expect(
      formatPricingLabel({
        maxAmount: 300,
        isDynamic: false,
        price: '50-300.00 USD',
      })
    ).toBe('$300.00');
  });
});
