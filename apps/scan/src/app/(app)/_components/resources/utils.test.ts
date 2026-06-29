import { describe, it, expect } from 'vitest';
import {
  getBazaarMethod,
  parseMinFromPriceString,
  parseMaxFromPriceString,
  getMaxUsdcAmount,
  formatPricingLabel,
} from './utils';
import { Methods } from '@/types/x402';

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
    expect(formatPricingLabel({ maxUsdAmount: 300, isDynamic: false })).toBe(
      '$300.00'
    );
  });

  it('shows "Up to" for dynamic without price', () => {
    expect(formatPricingLabel({ maxUsdAmount: 300, isDynamic: true })).toBe(
      'Up to $300.00'
    );
  });

  it('shows paid for fixed pricing without USD metadata or a USDC accept', () => {
    expect(formatPricingLabel({ maxUsdAmount: null, isDynamic: false })).toBe(
      'Paid'
    );
  });

  it('shows paid for dynamic pricing without USD metadata or a USDC accept', () => {
    expect(formatPricingLabel({ maxUsdAmount: null, isDynamic: true })).toBe(
      'Paid'
    );
  });

  it('shows "Up to" for dynamic with zero min', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: 300,
        isDynamic: true,
        price: '0-300.00 USD',
      })
    ).toBe('Up to $300.00');
  });

  it('shows range for dynamic with nonzero min', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: 300,
        isDynamic: true,
        price: '50-300.00 USD',
      })
    ).toBe('$50.00–$300.00');
  });

  it('shows range with small decimals', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: 5,
        isDynamic: true,
        price: '0.01-5.00 USD',
      })
    ).toBe('$0.01–$5.00');
  });

  it('shows "Up to" for dynamic with unparseable price', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: 300,
        isDynamic: true,
        price: 'garbage',
      })
    ).toBe('Up to $300.00');
  });

  it('does not treat an ambiguous bare fixed price as USD', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: null,
        isDynamic: false,
        price: '0.05',
      })
    ).toBe('Paid');
  });

  it('does not treat an ambiguous bare dynamic range as USD', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: null,
        isDynamic: true,
        price: '0.001000-0.126000',
      })
    ).toBe('Paid');
  });

  it('preserves explicit zero-dollar fixed metadata', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: null,
        isDynamic: false,
        price: '$0.00',
      })
    ).toBe('$0.00');
  });

  it('uses fixed USD price metadata instead of heterogeneous accept amounts', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: null,
        isDynamic: false,
        price: '0.05 USD',
      })
    ).toBe('$0.05');
  });

  it('falls back to max amount for fixed pricing with range metadata', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: 300,
        isDynamic: false,
        price: '50-300.00 USD',
      })
    ).toBe('$300.00');
  });

  it('uses dynamic USD metadata when no USDC accept exists', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: null,
        isDynamic: true,
        price: '0.001000-0.126000 USD',
      })
    ).toBe('< $0.01–$0.13');
  });

  it('uses price string max when probed maxAmount is lower (dynamic pricing)', () => {
    // Probe only sees min price for an empty request ($0.001), but the
    // discovery price string has the real max ($0.126).
    expect(
      formatPricingLabel({
        maxUsdAmount: 0.001,
        isDynamic: true,
        price: '0.001000-0.126000 USD',
      })
    ).toBe('< $0.01–$0.13');
  });

  it('uses probed maxAmount when it exceeds price string max', () => {
    expect(
      formatPricingLabel({
        maxUsdAmount: 500,
        isDynamic: true,
        price: '50-300.00 USD',
      })
    ).toBe('$50.00–$500.00');
  });
});

describe('getMaxUsdcAmount', () => {
  it('prefers known USDC accepts over custom-token accepts', () => {
    expect(
      getMaxUsdcAmount([
        {
          network: 'base',
          asset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          maxAmountRequired: 0.05,
        },
        {
          network: 'solana',
          asset: '6GGY8GViCR5v4xR4Lxb4nfiAJsEoJua5Gj6YecxbJ4BQ',
          maxAmountRequired: 1333.728512,
        },
      ])
    ).toBe(0.05);
  });

  it('returns null when no known USDC accept exists', () => {
    expect(
      getMaxUsdcAmount([
        {
          network: 'solana',
          asset: '6GGY8GViCR5v4xR4Lxb4nfiAJsEoJua5Gj6YecxbJ4BQ',
          maxAmountRequired: 1,
        },
        {
          network: 'solana',
          asset: 'AnotherTokenMint111111111111111111111111111111',
          maxAmountRequired: 2,
        },
      ])
    ).toBeNull();
  });

  it('ignores non-finite USDC amounts', () => {
    expect(
      getMaxUsdcAmount([
        {
          network: 'base',
          asset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          maxAmountRequired: Number.POSITIVE_INFINITY,
        },
      ])
    ).toBeNull();
  });
});

describe('getBazaarMethod', () => {
  it('returns explicit method from input schema', () => {
    expect(getBazaarMethod({ input: { method: 'GET' } })).toBe(Methods.GET);
    expect(getBazaarMethod({ input: { method: 'post' } })).toBe(Methods.POST);
  });

  it('infers POST when body exists', () => {
    expect(getBazaarMethod({ input: { body: { type: 'object' } } })).toBe(
      Methods.POST
    );
  });

  it('infers POST when bodyFields exists (v1)', () => {
    expect(
      getBazaarMethod({ input: { bodyFields: { name: { type: 'string' } } } })
    ).toBe(Methods.POST);
  });

  it('infers GET when only queryParams exists', () => {
    expect(
      getBazaarMethod({ input: { queryParams: { q: { type: 'string' } } } })
    ).toBe(Methods.GET);
  });

  it('defaults to GET for null/undefined schema', () => {
    expect(getBazaarMethod(null)).toBe(Methods.GET);
    expect(getBazaarMethod(undefined)).toBe(Methods.GET);
  });
});
