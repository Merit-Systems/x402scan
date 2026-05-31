import { describe, it, expect } from 'vitest';
import {
  parseMinFromPriceString,
  parseMaxFromPriceString,
  formatPricingLabel,
} from './utils';

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

describe('parseMaxFromPriceString', () => {
  it('parses integer max from range', () => {
    expect(parseMaxFromPriceString('50-300.00 USD')).toBe(300);
  });

  it('parses decimal max from range', () => {
    expect(parseMaxFromPriceString('0.001000-0.126000 USD')).toBe(0.126);
  });

  it('returns 0 for fixed price (no dash)', () => {
    expect(parseMaxFromPriceString('300.00 USD')).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(parseMaxFromPriceString('')).toBe(0);
  });

  it('returns 0 for garbage input', () => {
    expect(parseMaxFromPriceString('not a price')).toBe(0);
  });

  it('returns 0 when string starts with dash', () => {
    expect(parseMaxFromPriceString('-5.00 USD')).toBe(0);
  });

  it('handles no currency suffix', () => {
    expect(parseMaxFromPriceString('10-100')).toBe(100);
  });

  it('handles whitespace around dash', () => {
    expect(parseMaxFromPriceString('50 - 300.00 USD')).toBe(300);
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

  it('uses price string max when probed maxAmount is lower (dynamic pricing)', () => {
    // Probe only sees min price for an empty request ($0.001), but the
    // discovery price string has the real max ($0.126).
    expect(
      formatPricingLabel({
        maxAmount: 0.001,
        isDynamic: true,
        price: '0.001000-0.126000 USD',
      })
    ).toBe('< $0.01–$0.13');
  });

  it('uses probed maxAmount when it exceeds price string max', () => {
    expect(
      formatPricingLabel({
        maxAmount: 500,
        isDynamic: true,
        price: '50-300.00 USD',
      })
    ).toBe('$50.00–$500.00');
  });
});
